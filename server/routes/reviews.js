const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');
const createNotification = require('../utils/createNotification');

// ── Helpers ──────────────────────────────────────────────────

const mapReview = (row) => {
  if (!row) return null;
  const { reviewer, ...review } = row;
  return {
    ...review,
    _id: review.id,
    orderId: review.order_id,
    serviceId: review.service_id,
    reviewerId: review.reviewer_id,
    sellerId: review.seller_id,
    createdAt: review.created_at,
    reviewer: reviewer ? {
      _id: reviewer.id,
      name: reviewer.name,
      avatar: { public_id: reviewer.avatar_public_id || '', url: reviewer.avatar_url || '' },
      department: reviewer.department,
      yearOfStudy: reviewer.year_of_study,
    } : undefined,
  };
};

// ─────────────────────────────────────────────────────────────
// POST /api/reviews — create a review after order completion
// ─────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, service_id, status, is_reviewed')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'Only the buyer can leave a review' });
    if (order.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Order must be completed before reviewing' });
    if (order.is_reviewed)
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });

    // Create review (trigger auto-updates ratings)
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        order_id: order.id,
        service_id: order.service_id,
        reviewer_id: req.user._id,
        seller_id: order.seller_id,
        rating: Number(rating),
        comment,
      })
      .select('*, reviewer:users!reviewer_id(id, name, avatar_url, avatar_public_id, department, year_of_study)')
      .single();

    if (reviewErr) {
      if (reviewErr.code === '23505') // unique violation
        return res.status(400).json({ success: false, message: 'Already reviewed this order' });
      throw reviewErr;
    }

    // Mark order as reviewed
    await supabase.from('orders').update({ is_reviewed: true }).eq('id', order.id);

    // Notify seller about the review (non-blocking)
    createNotification({
      userId: order.seller_id,
      type: 'review_received',
      title: `⭐ New ${Number(rating)}-Star Review!`,
      body: `${req.user.name} left you a ${Number(rating)}-star review.`,
      link: `/profile/${order.seller_id}`,
    });

    res.status(201).json({ success: true, review: mapReview(review) });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/reviews/service/:serviceId — get reviews for a service
// ─────────────────────────────────────────────────────────────
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, reviewer:users!reviewer_id(id, name, avatar_url, avatar_public_id, department, year_of_study)')
      .eq('service_id', req.params.serviceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, reviews: reviews.map(mapReview) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
