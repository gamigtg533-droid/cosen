const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');
const createNotification = require('../utils/createNotification');
const { mapOrder } = require('./orders');

// ─────────────────────────────────────────────────────────────
// POST /api/sendiyou/:serviceId/accept — Accept a SendiYou post
// ─────────────────────────────────────────────────────────────
router.post('/:serviceId/accept', protect, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user._id;

    // 1. Fetch service
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select('*, seller:users!seller_id(id, name, email, gender)')
      .eq('id', serviceId)
      .maybeSingle();

    if (svcErr || !service) return res.status(404).json({ success: false, message: 'SendiYou post not found' });
    if (service.category !== 'SendiYou') return res.status(400).json({ success: false, message: 'This is not a SendiYou post' });
    if (!service.is_active) return res.status(400).json({ success: false, message: 'This connection has already been accepted or is no longer available.' });
    if (service.accepted_by_id) return res.status(400).json({ success: false, message: 'This connection has already been claimed.' });
    if (service.seller_id === userId) return res.status(400).json({ success: false, message: 'You cannot accept your own SendiYou post.' });

    // 2. Gender gate — acceptor must match preferred gender
    const { data: acceptor, error: accErr } = await supabase
      .from('users')
      .select('id, name, gender')
      .eq('id', userId)
      .single();

    if (accErr || !acceptor) return res.status(404).json({ success: false, message: 'User not found' });
    if (!acceptor.gender) return res.status(400).json({ success: false, message: 'Please set your gender in your profile before accepting a SendiYou connection.' });

    const preferred = service.preferred_gender;
    if (preferred && preferred !== 'Any' && preferred !== acceptor.gender) {
      return res.status(403).json({ success: false, message: `This connection is looking for a ${preferred} match. Your gender doesn't match.` });
    }

    // 3. Set expires_at = now + 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Update service: mark accepted, set expiry, deactivate from public browse
    const { error: updateErr } = await supabase
      .from('services')
      .update({
        accepted_by_id: userId,
        expires_at: expiresAt,
        is_active: false,
      })
      .eq('id', serviceId);

    if (updateErr) throw updateErr;

    // 5. Create an order linking buyer (acceptor) ↔ seller (poster)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        service_id: serviceId,
        buyer_id: userId,      // acceptor
        seller_id: service.seller_id,  // poster
        price: 0,
        platform_fee: 0,
        seller_earnings: 0,
        status: 'inProgress',
        requirements: '',
        buyer_revealed: false,
        seller_revealed: false,
      })
      .select(`
        *,
        service:services!service_id(id, title, category, display_name, preferred_gender, identity_hidden, expires_at),
        buyer:users!buyer_id(id, name, email, avatar_url, phone, is_phone_verified, gender),
        seller:users!seller_id(id, name, email, avatar_url, phone, is_phone_verified, gender)
      `)
      .single();

    if (orderErr) throw orderErr;

    // 6. Notify both parties
    createNotification({
      userId: service.seller_id,
      type: 'order_placed',
      title: '💌 Someone Accepted Your Connection!',
      body: `${acceptor.name} accepted your SendiYou connection. Start chatting now!`,
      link: `/orders/${order.id}`,
    }).catch(console.error);

    createNotification({
      userId: userId,
      type: 'order_placed',
      title: '💌 Connection Accepted!',
      body: `You accepted a SendiYou connection. Chat expires in 7 days!`,
      link: `/orders/${order.id}`,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      orderId: order.id,
      expiresAt,
      message: 'Connection accepted! You have 7 days to chat.',
    });
  } catch (error) {
    console.error('Accept SendiYou error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/sendiyou/order/:orderId/reveal — Toggle profile reveal
// ─────────────────────────────────────────────────────────────
router.put('/order/:orderId/reveal', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, service:services!service_id(category)')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.service?.category !== 'SendiYou') return res.status(400).json({ success: false, message: 'Not a SendiYou order' });

    const isBuyer = order.buyer_id === userId;
    const isSeller = order.seller_id === userId;
    if (!isBuyer && !isSeller) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const update = isBuyer
      ? { buyer_revealed: !order.buyer_revealed }
      : { seller_revealed: !order.seller_revealed };

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update(update)
      .eq('id', orderId)
      .select(`
        *,
        service:services!service_id(id, title, category, display_name, preferred_gender, identity_hidden, expires_at),
        buyer:users!buyer_id(id, name, email, avatar_url, department, year_of_study, bio, rating, phone, is_phone_verified, gender),
        seller:users!seller_id(id, name, email, avatar_url, department, year_of_study, bio, rating, phone, is_phone_verified, gender)
      `)
      .single();

    if (updateErr) throw updateErr;

    res.status(200).json({ success: true, order: mapOrder(updated, userId) });
  } catch (error) {
    console.error('Reveal toggle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
