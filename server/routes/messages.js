const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────

const mapMessage = (row) => {
  if (!row) return null;
  const { sender, ...msg } = row;
  return {
    ...msg,
    _id: msg.id,
    orderId: msg.order_id,
    senderId: msg.sender_id,
    createdAt: msg.created_at,
    sender: sender ? {
      _id: sender.id,
      name: sender.name,
      avatar: { public_id: sender.avatar_public_id || '', url: sender.avatar_url || '' },
    } : undefined,
  };
};

// Helper: verify user is buyer or seller of the order
const verifyOrderAccess = async (orderId, userId) => {
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return null;
  return (order.buyer_id === userId || order.seller_id === userId) ? order : false;
};

// ─────────────────────────────────────────────────────────────
// GET /api/messages/order/:orderId — get all messages for an order
// ─────────────────────────────────────────────────────────────
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const access = await verifyOrderAccess(req.params.orderId, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Access denied' });

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(id, name, avatar_url, avatar_public_id)')
      .eq('order_id', req.params.orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark unread messages (not sent by current user) as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('order_id', req.params.orderId)
      .neq('sender_id', req.user._id)
      .eq('read', false);

    res.status(200).json({ success: true, messages: messages.map(mapMessage) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/messages/order/:orderId — send a message
// ─────────────────────────────────────────────────────────────
router.post('/order/:orderId', protect, async (req, res) => {
  try {
    const access = await verifyOrderAccess(req.params.orderId, req.user._id);
    if (!access) return res.status(403).json({ success: false, message: 'Access denied' });

    const { content } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        order_id: req.params.orderId,
        sender_id: req.user._id,
        content: content.trim(),
      })
      .select('*, sender:users!sender_id(id, name, avatar_url, avatar_public_id)')
      .single();

    if (error) throw error;

    const mapped = mapMessage(message);

    // Broadcast message to Socket.io order room in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.orderId).emit('receive_message', mapped);
    }

    res.status(201).json({ success: true, message: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
