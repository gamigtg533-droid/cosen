const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// GET /api/notifications — last 20 notifications for current user
// ─────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user._id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, notifications: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/notifications/count — unread count for badge
// ─────────────────────────────────────────────────────────────
router.get('/count', protect, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user._id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true, unread: count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read — mark one notification as read
// ─────────────────────────────────────────────────────────────
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user._id); // ensure ownership

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all — mark all as read
// ─────────────────────────────────────────────────────────────
router.patch('/read-all', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user._id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
