const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { supabase } = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats — Platform overview analytics
// ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    // Fetch all counts in parallel
    const [
      usersRes,
      verifiedUsersRes,
      pendingVerificationsRes,
      activeServicesRes,
      totalOrdersRes,
      disputedOrdersRes,
      completedOrdersRes,
      manualOrdersRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('id_card_status', 'approved'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('id_card_status', 'pending'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
      supabase.from('orders').select('id, price, platform_fee, payment_method', { count: 'exact' }).eq('status', 'completed'),
      supabase.from('orders').select('id, price').eq('payment_method', 'manual').eq('manual_payment_status', 'seller_confirmed'),
    ]);

    // Calculate financial metrics
    const completedOrders = completedOrdersRes.data || [];
    const razorpayOrders = completedOrders.filter(o => o.payment_method === 'razorpay' || !o.payment_method); // Treat empty as legacy razorpay
    
    const totalEscrowVolume = razorpayOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const totalPlatformRevenue = razorpayOrders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
    
    const manualConfirmedOrders = manualOrdersRes.data || [];
    const manualPaymentVolume = manualConfirmedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

    // Services by category breakdown
    const { data: categoryData } = await supabase
      .from('services')
      .select('category')
      .eq('is_active', true);

    const categoryBreakdown = {};
    (categoryData || []).forEach(s => {
      categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + 1;
    });

    // Recent signups (last 7 days) by day
    const { data: recentUsers } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    const signupsByDay = {};
    (recentUsers || []).forEach(u => {
      const day = new Date(u.created_at).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalUsers: usersRes.count || 0,
        verifiedUsers: verifiedUsersRes.count || 0,
        pendingVerifications: pendingVerificationsRes.count || 0,
        activeServices: activeServicesRes.count || 0,
        totalOrders: totalOrdersRes.count || 0,
        openDisputes: disputedOrdersRes.count || 0,
        completedOrders: completedOrders.length,
        totalEscrowVolume,
        totalPlatformRevenue,
        manualPaymentVolume,
        categoryBreakdown,
        signupsByDay,
      }
    });
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/verifications — List pending ID verifications
// ─────────────────────────────────────────────────────────────
router.get('/verifications', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, id_card_image_url, id_card_status, id_card_rejection_reason, department, year_of_study, dob, created_at')
      .eq('id_card_status', status)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, users: users || [] });
  } catch (error) {
    console.error('[Admin] Verifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching verifications' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/verifications/:userId/resolve
// ─────────────────────────────────────────────────────────────
router.put('/verifications/:userId/resolve', async (req, res) => {
  try {
    const { verdict, reason } = req.body; // verdict: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(verdict)) {
      return res.status(400).json({ success: false, message: 'Invalid verdict. Must be approved or rejected.' });
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, id_card_status')
      .eq('id', req.params.userId)
      .single();

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'User not found' });

    const updateData = {
      id_card_status: verdict,
    };

    if (verdict === 'rejected') {
      if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      updateData.id_card_rejection_reason = reason;
      updateData.is_onboarding_complete = false; // force re-upload
    } else {
      updateData.id_card_rejection_reason = null;
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.userId);

    if (updateErr) throw updateErr;

    // Send notification to user
    createNotification({
      userId: user.id,
      type: verdict === 'approved' ? 'order_completed' : 'order_disputed',
      title: verdict === 'approved' ? '✅ Student ID Verified!' : '❌ Student ID Rejected',
      body: verdict === 'approved'
        ? 'Your student ID card has been verified. You can now post services and place orders on Cosen!'
        : `Your student ID was rejected: "${reason}". Please re-upload a clearer ID card to continue.`,
      link: verdict === 'rejected' ? '/onboarding' : '/browse',
    });

    // Email notification (non-blocking)
    sendEmail({
      email: user.email,
      subject: verdict === 'approved' ? '✅ You\'re Verified on Cosen!' : '⚠️ Student ID Verification Issue',
      message: verdict === 'approved'
        ? `Hi ${user.name},\n\nYour student ID card has been approved. Welcome to the Cosen marketplace!\n\nYou can now post services and place orders.\n\nTeam Cosen`
        : `Hi ${user.name},\n\nYour student ID card verification was rejected.\n\nReason: ${reason}\n\nPlease log back into Cosen and re-upload a valid, clear photo of your student ID.\n\nTeam Cosen`,
    }).catch(err => console.error('[Admin] Verification email error:', err.message));

    res.json({ success: true, message: `User ${verdict === 'approved' ? 'approved' : 'rejected'} successfully.` });
  } catch (error) {
    console.error('[Admin] Verification resolve error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving verification' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/disputes — List disputed orders
// ─────────────────────────────────────────────────────────────
router.get('/disputes', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!service_id(id, title, category, price, images),
        buyer:users!buyer_id(id, name, email, avatar_url),
        seller:users!seller_id(id, name, email, avatar_url)
      `)
      .eq('status', 'disputed')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const mapped = (orders || []).map(o => ({
      _id: o.id,
      price: o.price,
      platformFee: o.platform_fee,
      sellerEarnings: o.seller_earnings,
      status: o.status,
      disputeReason: o.dispute_reason,
      disputeVerdict: o.dispute_verdict,
      disputeResolvedAt: o.dispute_resolved_at,
      buyerResult: o.buyer_result,
      sellerResult: o.seller_result,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      service: o.service ? { _id: o.service.id, title: o.service.title, category: o.service.category, price: o.service.price, images: o.service.images } : null,
      buyer: o.buyer ? { _id: o.buyer.id, name: o.buyer.name, email: o.buyer.email, avatar: { url: o.buyer.avatar_url } } : null,
      seller: o.seller ? { _id: o.seller.id, name: o.seller.name, email: o.seller.email, avatar: { url: o.seller.avatar_url } } : null,
    }));

    res.json({ success: true, orders: mapped });
  } catch (error) {
    console.error('[Admin] Disputes error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching disputes' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/disputes/:orderId/messages — Audit chat transcript
// ─────────────────────────────────────────────────────────────
router.get('/disputes/:orderId/messages', async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, created_at, sender:users!sender_id(id, name, avatar_url)')
      .eq('order_id', req.params.orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, messages: (messages || []).map(m => ({
      _id: m.id,
      content: m.content,
      createdAt: m.created_at,
      sender: m.sender ? { _id: m.sender.id, name: m.sender.name, avatar: { url: m.sender.avatar_url } } : null,
    })) });
  } catch (error) {
    console.error('[Admin] Dispute messages error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dispute messages' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/disputes/:orderId/resolve — Issue verdict
// ─────────────────────────────────────────────────────────────
router.put('/disputes/:orderId/resolve', async (req, res) => {
  try {
    const { verdict, winnerId } = req.body;
    // verdict: 'refund_buyer' | 'release_seller' | 'settle_playground'
    if (!['refund_buyer', 'release_seller', 'settle_playground'].includes(verdict)) {
      return res.status(400).json({ success: false, message: 'Invalid verdict' });
    }

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!service_id(id, title, category),
        buyer:users!buyer_id(id, name, email),
        seller:users!seller_id(id, name, email)
      `)
      .eq('id', req.params.orderId)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Order is not in disputed status' });
    }

    const now = new Date().toISOString();
    let updateData = {
      dispute_verdict: verdict,
      dispute_resolved_at: now,
    };

    let buyerNotif = null, sellerNotif = null;

    if (verdict === 'refund_buyer') {
      updateData.status = 'cancelled';
      buyerNotif = { title: '✅ Dispute Resolved — Refund Granted', body: `Admin has reviewed your dispute for "${order.service?.title || 'your order'}" and issued a full refund.` };
      sellerNotif = { title: '⚠️ Dispute Resolved — Refund to Buyer', body: `Admin has resolved the dispute for "${order.service?.title || 'the order'}" in the buyer's favor.` };
    } else if (verdict === 'release_seller') {
      updateData.status = 'completed';
      updateData.completed_at = now;
      buyerNotif = { title: '⚠️ Dispute Resolved — Payment Released', body: `Admin reviewed your dispute for "${order.service?.title || 'your order'}" and released payment to the seller.` };
      sellerNotif = { title: '✅ Dispute Resolved — Payment Released!', body: `Admin resolved the dispute for "${order.service?.title}" in your favor. Your earnings have been released!` };
    } else if (verdict === 'settle_playground') {
      // For playground matches, set the winner
      if (!winnerId) return res.status(400).json({ success: false, message: 'winnerId required for playground settlement' });
      const winnerEarnings = Math.round(order.price * 1.8); // 10% commission on total pool
      updateData.status = 'completed';
      updateData.winner_id = winnerId;
      updateData.winner_earnings = winnerEarnings;
      updateData.completed_at = now;
      const loserId = winnerId === order.buyer_id ? order.seller_id : order.buyer_id;
      buyerNotif = null; sellerNotif = null;
      // Targeted notifications
      createNotification({ userId: winnerId, type: 'order_completed', title: '🏆 Match Settled — You Won!', body: `Admin settled the match. ₹${winnerEarnings} prize pool credited!`, link: `/orders/${order.id}` });
      createNotification({ userId: loserId, type: 'order_completed', title: '🔴 Match Settled', body: 'Admin has reviewed and settled the match result.', link: `/orders/${order.id}` });
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.orderId);

    if (updateErr) throw updateErr;

    if (buyerNotif && order.buyer) {
      createNotification({ userId: order.buyer_id, type: verdict === 'refund_buyer' ? 'order_completed' : 'order_disputed', title: buyerNotif.title, body: buyerNotif.body, link: `/orders/${order.id}` });
    }
    if (sellerNotif && order.seller) {
      createNotification({ userId: order.seller_id, type: verdict === 'release_seller' ? 'order_completed' : 'order_disputed', title: sellerNotif.title, body: sellerNotif.body, link: `/orders/${order.id}` });
    }

    res.json({ success: true, message: 'Dispute resolved successfully.' });
  } catch (error) {
    console.error('[Admin] Dispute resolve error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving dispute' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users — List all users
// ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, role, id_card_status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('users')
      .select('id, name, email, avatar_url, role, id_card_status, is_suspended, is_email_verified, created_at, department, year_of_study, rating, review_count', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) query = query.eq('role', role);
    if (id_card_status) query = query.eq('id_card_status', id_card_status);

    const { data: users, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, users: users || [], total: count || 0, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[Admin] Users list error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/users/:userId/suspend — Toggle user suspension
// ─────────────────────────────────────────────────────────────
router.put('/users/:userId/suspend', async (req, res) => {
  try {
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, is_suspended, role')
      .eq('id', req.params.userId)
      .single();

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot suspend an admin account' });

    const newSuspended = !user.is_suspended;
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_suspended: newSuspended })
      .eq('id', req.params.userId);

    if (updateErr) throw updateErr;

    // Notify user (non-blocking)
    createNotification({
      userId: user.id,
      type: 'order_disputed',
      title: newSuspended ? '🚫 Account Suspended' : '✅ Account Restored',
      body: newSuspended
        ? 'Your Cosen account has been suspended for violating platform guidelines. Contact support to appeal.'
        : 'Your account suspension has been lifted. Welcome back to Cosen!',
      link: '/browse',
    });

    res.json({ success: true, suspended: newSuspended, message: `User ${newSuspended ? 'suspended' : 'restored'} successfully.` });
  } catch (error) {
    console.error('[Admin] Suspend user error:', error);
    res.status(500).json({ success: false, message: 'Server error toggling suspension' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/users/:userId/role — Promote user to admin
// ─────────────────────────────────────────────────────────────
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be student or admin.' });
    }
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.userId);

    if (error) throw error;
    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('[Admin] Role update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/services — List all services
// ─────────────────────────────────────────────────────────────
router.get('/services', async (req, res) => {
  try {
    const { search, category, is_active, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('services')
      .select(`
        id, title, category, price, rating, review_count, is_active, created_at, images,
        seller:users!seller_id(id, name, email, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) query = query.ilike('title', `%${search}%`);
    if (category) query = query.eq('category', category);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    const { data: services, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, services: services || [], total: count || 0, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[Admin] Services list error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching services' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/services/:serviceId/status — Toggle service active
// ─────────────────────────────────────────────────────────────
router.put('/services/:serviceId/status', async (req, res) => {
  try {
    const { data: service, error: fetchErr } = await supabase
      .from('services')
      .select('id, title, is_active, seller_id')
      .eq('id', req.params.serviceId)
      .single();

    if (fetchErr || !service) return res.status(404).json({ success: false, message: 'Service not found' });

    const newActive = !service.is_active;
    const { error: updateErr } = await supabase
      .from('services')
      .update({ is_active: newActive })
      .eq('id', req.params.serviceId);

    if (updateErr) throw updateErr;

    createNotification({
      userId: service.seller_id,
      type: newActive ? 'order_completed' : 'order_disputed',
      title: newActive ? '✅ Service Reactivated' : '🚫 Service Suspended',
      body: newActive
        ? `Your service "${service.title}" has been reactivated by admin.`
        : `Your service "${service.title}" has been suspended for violating platform guidelines.`,
      link: `/services/${service.id}`,
    });

    res.json({ success: true, isActive: newActive, message: `Service ${newActive ? 'activated' : 'deactivated'} successfully.` });
  } catch (error) {
    console.error('[Admin] Service status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating service status' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/orders — Search & list all orders
// ─────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let orders = [];
    let total = 0;

    if (search && search.trim()) {
      let term = search.trim().toLowerCase();
      if (term.startsWith('#')) {
        term = term.slice(1);
      }

      // Fetch recent 1000 orders to search through in JS (extremely reliable for partial UUIDs)
      let query = supabase
        .from('orders')
        .select(`
          *,
          service:services!service_id(id, title, category, price),
          buyer:users!buyer_id(id, name, email),
          seller:users!seller_id(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter in JS to support partial matches on UUID, names, emails, and titles
      const filtered = (data || []).filter(o => {
        const orderId = String(o.id || '').toLowerCase();
        const serviceTitle = String(o.service?.title || '').toLowerCase();
        const buyerName = String(o.buyer?.name || '').toLowerCase();
        const buyerEmail = String(o.buyer?.email || '').toLowerCase();
        const sellerName = String(o.seller?.name || '').toLowerCase();
        const sellerEmail = String(o.seller?.email || '').toLowerCase();

        return orderId.includes(term) ||
               serviceTitle.includes(term) ||
               buyerName.includes(term) ||
               buyerEmail.includes(term) ||
               sellerName.includes(term) ||
               sellerEmail.includes(term);
      });

      total = filtered.length;
      orders = filtered.slice(offset, offset + Number(limit));
    } else {
      // Normal paginated fetch
      let query = supabase
        .from('orders')
        .select(`
          *,
          service:services!service_id(id, title, category, price),
          buyer:users!buyer_id(id, name, email),
          seller:users!seller_id(id, name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      orders = data || [];
      total = count || 0;
    }

    res.json({
      success: true,
      orders: orders.map(o => ({
        _id: o.id,
        price: o.price,
        status: o.status,
        createdAt: o.created_at,
        service: o.service ? { _id: o.service.id, title: o.service.title, category: o.service.category, price: o.service.price } : null,
        buyer: o.buyer ? { _id: o.buyer.id, name: o.buyer.name, email: o.buyer.email } : null,
        seller: o.seller ? { _id: o.seller.id, name: o.seller.name, email: o.seller.email } : null,
      })),
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('[Admin] Orders list error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/orders/:orderId — Single order detail audit
// ─────────────────────────────────────────────────────────────
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!service_id(*),
        buyer:users!buyer_id(*),
        seller:users!seller_id(*),
        review:reviews(rating, comment, created_at)
      `)
      .eq('id', req.params.orderId)
      .maybeSingle();

    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Fetch associated payout (if any)
    const { data: payout } = await supabase
      .from('payouts')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    // Fetch chat messages audit transcript
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, sender_id,
        sender:users!sender_id(name)
      `)
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      order: {
        _id: order.id,
        price: order.price,
        platformFee: order.platform_fee,
        sellerEarnings: order.seller_earnings,
        status: order.status,
        deliveryNote: order.delivery_note,
        disputeReason: order.dispute_reason,
        disputeVerdict: order.dispute_verdict,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        deliveredAt: order.delivered_at,
        completedAt: order.completed_at,
        service: order.service ? {
          _id: order.service.id,
          title: order.service.title,
          category: order.service.category,
          price: order.service.price,
          deliveryDays: order.service.delivery_days,
          is_active: order.service.is_active
        } : null,
        buyer: order.buyer ? {
          _id: order.buyer.id,
          name: order.buyer.name,
          email: order.buyer.email,
          phone: order.buyer.phone,
          isPhoneVerified: order.buyer.is_phone_verified,
          avatar: { url: order.buyer.avatar_url }
        } : null,
        seller: order.seller ? {
          _id: order.seller.id,
          name: order.seller.name,
          email: order.seller.email,
          phone: order.seller.phone,
          isPhoneVerified: order.seller.is_phone_verified,
          upiId: order.seller.upi_id,
          avatar: { url: order.seller.avatar_url }
        } : null,
        review: order.review,
        payout: payout ? {
          id: payout.id,
          amount: payout.amount,
          upi_id: payout.upi_id,
          status: payout.status,
          paid_at: payout.paid_at,
          created_at: payout.created_at
        } : null,
        messages: (messages || []).map(m => ({
          _id: m.id,
          content: m.content,
          createdAt: m.created_at,
          senderId: m.sender_id,
          senderName: m.sender?.name || 'User'
        }))
      }
    });
  } catch (error) {
    console.error('[Admin] Get order detail error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order details' });
  }
});

module.exports = router;
