const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');
const createNotification = require('../utils/createNotification');
const { mapOrder } = require('./orders');

// ── Helper: generate A-Z, AA, AB... alias from index ────────────
function generateAlias(index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let alias = '';
  let n = index;
  do {
    alias = letters[n % 26] + alias;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return alias;
}

// ─────────────────────────────────────────────────────────────
// POST /api/sendiyou/:serviceId/accept — Accept a SendiYou post
// ─────────────────────────────────────────────────────────────
router.post('/:serviceId/accept', protect, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user._id;

    // 1. Fetch service with group_size
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select('*, seller:users!seller_id(id, name, email, gender)')
      .eq('id', serviceId)
      .maybeSingle();

    if (svcErr || !service) return res.status(404).json({ success: false, message: 'SendiYou post not found' });
    if (service.category !== 'SendiYou') return res.status(400).json({ success: false, message: 'This is not a SendiYou post' });
    if (!service.is_active) return res.status(400).json({ success: false, message: 'This connection is no longer available.' });
    if (service.seller_id === userId) return res.status(400).json({ success: false, message: 'You cannot accept your own SendiYou post.' });

    const groupSize = service.group_size || 1;

    // 2. Gender gate
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

    // 3. Check if a group order already exists for this service
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, buyer_ids, member_aliases')
      .eq('service_id', serviceId)
      .eq('seller_id', service.seller_id)
      .maybeSingle();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let order;

    if (existingOrder) {
      // 4a. Group order already exists — check if user already joined
      const currentMembers = existingOrder.buyer_ids || [];

      if (currentMembers.includes(userId)) {
        return res.status(400).json({ success: false, message: 'You have already joined this group connection.', orderId: existingOrder.id });
      }

      if (currentMembers.length >= groupSize) {
        return res.status(400).json({ success: false, message: 'This group is already full.' });
      }

      // Append user to buyer_ids
      const updatedMembers = [...currentMembers, userId];
      const isFull = updatedMembers.length >= groupSize;

      // Assign next alias to new member
      // Seller = index 0 (A), first buyer = index 1 (B), next = index 2 (C)...
      const currentAliases = existingOrder.member_aliases || {};
      const nextIndex = Object.keys(currentAliases).length; // next slot
      const updatedAliases = { ...currentAliases, [userId]: generateAlias(nextIndex) };

      const { error: updateErr } = await supabase
        .from('orders')
        .update({ buyer_ids: updatedMembers, member_aliases: updatedAliases })
        .eq('id', existingOrder.id);

      if (updateErr) throw updateErr;

      // If group is now full, deactivate the service
      if (isFull) {
        await supabase
          .from('services')
          .update({ is_active: false, accepted_by_id: userId })
          .eq('id', serviceId);
      }

      order = { id: existingOrder.id };
    } else {
      // 4b. No group order yet — create one
      const isGroupFull = groupSize <= 1;

      if (isGroupFull) {
        // Solo connection — deactivate immediately
        await supabase
          .from('services')
          .update({ accepted_by_id: userId, expires_at: expiresAt, is_active: false })
          .eq('id', serviceId);
      }

      // Seller gets alias "A" (index 0), first joiner gets "B" (index 1)
      const initialAliases = {
        [service.seller_id]: generateAlias(0), // A
        [userId]: generateAlias(1),             // B
      };

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          service_id: serviceId,
          buyer_id: userId,
          seller_id: service.seller_id,
          price: 0,
          platform_fee: 0,
          seller_earnings: 0,
          status: 'inProgress',
          requirements: '',
          buyer_revealed: false,
          seller_revealed: false,
          buyer_ids: [userId],
          member_aliases: initialAliases,
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;
      order = newOrder;
    }

    // 5. Notify both parties
    createNotification({
      userId: service.seller_id,
      type: 'order_placed',
      title: '💌 Someone Joined Your Connection!',
      body: `${acceptor.name} joined your SendiYou connection. Start chatting now!`,
      link: `/orders/${order.id}`,
    }).catch(console.error);

    createNotification({
      userId: userId,
      type: 'order_placed',
      title: '💌 Connection Joined!',
      body: `You joined a SendiYou group connection. Chat expires in 7 days!`,
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
// PUT /api/sendiyou/order/:orderId/reveal — Toggle profile reveal (individual & group)
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

    // Any party — buyer, seller, or group member — can toggle their reveal
    const allPartyIds = [order.buyer_id, order.seller_id, ...(order.buyer_ids || [])];
    if (!allPartyIds.includes(userId)) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // Toggle: add if not in array, remove if already in
    const currentRevealed = order.revealed_ids || [];
    const isRevealed = currentRevealed.includes(userId);
    const newRevealedIds = isRevealed
      ? currentRevealed.filter(id => id !== userId)   // un-reveal
      : [...currentRevealed, userId];                  // reveal

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ revealed_ids: newRevealedIds })
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
