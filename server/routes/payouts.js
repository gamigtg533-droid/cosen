const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { supabase } = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '25se02ml132@ppsu.ac.in';

// ─────────────────────────────────────────────────────────────
// GET /api/payouts/pending — Admin: all pending payouts
// ─────────────────────────────────────────────────────────────
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select(`
        id, amount, upi_id, status, created_at, paid_at, order_id,
        seller:users!seller_id(id, name, email, avatar_url),
        order:orders!order_id(id, price, seller_earnings, service:services!service_id(title))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, payouts: data || [] });
  } catch (err) {
    console.error('[Payouts] Fetch pending error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending payouts' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payouts/completed — Admin: all completed payouts
// ─────────────────────────────────────────────────────────────
router.get('/completed', protect, adminOnly, async (req, res) => {
  try {
    const { type = 'razorpay' } = req.query;

    if (type === 'razorpay') {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          id, amount, upi_id, status, created_at, paid_at, order_id,
          seller:users!seller_id(id, name, email, avatar_url),
          order:orders!order_id(id, price, seller_earnings, service:services!service_id(title))
        `)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return res.json({ success: true, payouts: data || [] });
    } else if (type === 'manual') {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, price, updated_at, created_at, seller_id,
          seller:users!seller_id(id, name, email, avatar_url, upi_id),
          service:services!service_id(title)
        `)
        .eq('payment_method', 'manual')
        .eq('manual_payment_status', 'seller_confirmed')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped = (data || []).map(o => ({
        id: `manual-${o.id}`,
        amount: o.price,
        upi_id: o.seller?.upi_id || 'Direct Payment',
        status: 'paid',
        created_at: o.created_at,
        paid_at: o.updated_at,
        order_id: o.id,
        seller: o.seller,
        order: {
          id: o.id,
          price: o.price,
          seller_earnings: o.price,
          service: o.service
        }
      }));

      return res.json({ success: true, payouts: mapped });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payout type' });
    }
  } catch (err) {
    console.error('[Payouts] Fetch completed error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch completed payouts' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payouts/my — Seller: own payout history
// ─────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select(`
        id, amount, upi_id, status, created_at, paid_at, order_id,
        order:orders!order_id(id, price, service:services!service_id(title))
      `)
      .eq('seller_id', req.user._id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, payouts: data || [] });
  } catch (err) {
    console.error('[Payouts] Fetch my payouts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch your payouts' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/payouts/:id/mark-paid — Admin: mark payout as paid
// ─────────────────────────────────────────────────────────────
router.patch('/:id/mark-paid', protect, adminOnly, async (req, res) => {
  try {
    // Fetch payout with seller and order info
    const { data: payout, error: fetchErr } = await supabase
      .from('payouts')
      .select(`
        id, amount, upi_id, status, order_id, seller_id,
        seller:users!seller_id(id, name, email)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }
    if (payout.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payout is already marked as paid' });
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('payouts')
      .update({ status: 'paid', paid_at: now })
      .eq('id', req.params.id);

    if (updateErr) throw updateErr;

    const shortOrderId = String(payout.order_id).slice(-8).toUpperCase();

    // Send in-app notification to the seller (non-blocking)
    if (payout.seller_id) {
      createNotification({
        userId: payout.seller_id,
        type: 'order_completed',
        title: '💸 Payment Successfully!',
        body: `Your earnings of ₹${Number(payout.amount).toLocaleString('en-IN')} for order #${shortOrderId} have been transferred to your UPI ID: ${payout.upi_id}.`,
        link: `/orders/${payout.order_id}`,
      }).catch(e => console.error('[Payouts] Seller in-app notification error:', e.message));
    }

    // Email seller (non-blocking)
    if (payout.seller?.email) {
      sendEmail({
        email: payout.seller.email,
        subject: '💸 Payment Released — Cosen',
        message: `Hi ${payout.seller.name},\n\nYour earnings of ₹${Number(payout.amount).toLocaleString('en-IN')} for order #${shortOrderId} have been transferred to your UPI ID: ${payout.upi_id}.\n\nPlease check your UPI app within 24 hours. If you don't receive it, reply to this email.\n\nThank you for being part of Cosen!\n\nTeam Cosen`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#635BFF;margin-bottom:8px">💸 Payment Released!</h2>
            <p style="color:#4A5568">Hi <strong>${payout.seller.name}</strong>,</p>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:20px 0">
              <p style="margin:0;font-size:28px;font-weight:bold;color:#16A34A">₹${Number(payout.amount).toLocaleString('en-IN')}</p>
              <p style="margin:4px 0 0;color:#6B7280;font-size:14px">Transferred to <strong>${payout.upi_id}</strong></p>
            </div>
            <p style="color:#4A5568">For order <strong>#${shortOrderId}</strong>. Please check your UPI app within 24 hours.</p>
            <p style="color:#9CA3AF;font-size:13px">If you don't receive it, please contact us by replying to this email.</p>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
            <p style="color:#9CA3AF;font-size:12px">Team Cosen · Campus Marketplace</p>
          </div>`,
      }).catch(e => console.error('[Payouts] Seller email error:', e.message));
    }

    res.json({ success: true, message: 'Payout marked as paid. Email and notification sent to seller.' });
  } catch (err) {
    console.error('[Payouts] Mark paid error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark payout as paid' });
  }
});

module.exports = router;
