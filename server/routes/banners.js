const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// ── multer — RAM storage, 20MB max, images only ────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─────────────────────────────────────────────────────────────
// GET /api/banners — PUBLIC: return all active banners (for Browse page)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('id, url, label, sort_order, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, banners: data || [] });
  } catch (err) {
    console.error('[Banners] GET error:', err);
    res.status(500).json({ success: false, message: 'Server error', banners: [] });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/banners — ADMIN: return ALL banners (active + hidden)
// NOTE: This is called from admin.js indirectly by the frontend calling /api/admin/banners
//       We register it via server.js under /api/banners, so this is also:
//       GET /api/banners/admin — BUT for simplicity we handle it in admin.js directly.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// POST /api/banners/admin — ADMIN: Upload a new banner
// ─────────────────────────────────────────────────────────────
router.post('/admin', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const ext = path.extname(req.file.originalname);
    const fileName = `hero_banners/${crypto.randomBytes(16).toString('hex')}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from('uploads')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Get current max sort_order
    const { data: existing } = await supabase
      .from('hero_banners')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    // Insert banner record
    const { data: banner, error: insertErr } = await supabase
      .from('hero_banners')
      .insert({
        url: publicUrl,
        label: (req.body.label || '').trim() || null,
        sort_order: nextOrder,
        is_active: true,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({ success: true, banner, message: 'Banner uploaded successfully' });
  } catch (err) {
    console.error('[Banners] POST admin error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/banners/admin/list — ADMIN: all banners
// ─────────────────────────────────────────────────────────────
router.get('/admin/list', protect, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, banners: data || [] });
  } catch (err) {
    console.error('[Banners] GET admin list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/banners/admin/:id — ADMIN: Delete a banner
// ─────────────────────────────────────────────────────────────
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch banner to get URL (we derive storage path from it)
    const { data: banner, error: fetchErr } = await supabase
      .from('hero_banners')
      .select('id, url')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    // Derive storage path from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/uploads/hero_banners/<file>
    try {
      const urlObj = new URL(banner.url);
      const parts = urlObj.pathname.split('/public/uploads/');
      if (parts[1]) {
        await supabase.storage.from('uploads').remove([parts[1]]);
      }
    } catch (_) { /* ignore storage delete errors */ }

    // Delete from DB
    const { error: deleteErr } = await supabase.from('hero_banners').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    console.error('[Banners] DELETE error:', err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/banners/admin/:id/toggle — ADMIN: Toggle is_active
// ─────────────────────────────────────────────────────────────
router.patch('/admin/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const { is_active } = req.body;
    const { error } = await supabase
      .from('hero_banners')
      .update({ is_active })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[Banners] PATCH toggle error:', err);
    res.status(500).json({ success: false, message: 'Toggle failed' });
  }
});

module.exports = router;
