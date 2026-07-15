const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');

const COMMISSION = 0.10; // 10% platform fee
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

// ── Email Notification Helper ─────────────────────────────────
const sendOrderEmail = (type, ctx) => {
  const { buyerName, buyerEmail, sellerName, sellerEmail, serviceTitle, orderId, price } = ctx;
  const orderUrl = `${FRONTEND_URL}/orders/${orderId}`;
  const fmt = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  const card = (content) => `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#635BFF,#A78BFA);padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cosen Campus Marketplace</h1>
      </div>
      <div style="padding:32px;">${content}</div>
      <div style="background:#F6F9FC;padding:16px 32px;text-align:center;font-size:12px;color:#8898AA;">
        &copy; 2025 Cosen — Campus Marketplace
      </div>
    </div>`;

  const btn = (url, label) =>
    `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#635BFF,#A78BFA);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>`;

  const templates = {
    placed: {
      to: sellerEmail,
      subject: `🛒 New Order — ${serviceTitle}`,
      html: card(`
        <h2 style="color:#0A2540;margin-top:0;">You have a new order! 🎉</h2>
        <p style="color:#425466;">Hi <strong>${sellerName}</strong>, <strong>${buyerName}</strong> has placed an order for your service.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#8898AA;">Service</td><td style="padding:8px 0;font-weight:600;color:#0A2540;">${serviceTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#8898AA;">Amount</td><td style="padding:8px 0;font-weight:600;color:#635BFF;">${fmt(price)}</td></tr>
        </table>
        <p style="color:#425466;">Go to your order to review requirements and start working.</p>
        ${btn(orderUrl, 'View Order →')}
      `),
    },
    delivered: {
      to: buyerEmail,
      subject: `📦 Order Delivered — ${serviceTitle}`,
      html: card(`
        <h2 style="color:#0A2540;margin-top:0;">Your order has been delivered! 📦</h2>
        <p style="color:#425466;">Hi <strong>${buyerName}</strong>, <strong>${sellerName}</strong> has marked your order as delivered.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#8898AA;">Service</td><td style="padding:8px 0;font-weight:600;color:#0A2540;">${serviceTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#8898AA;">Amount</td><td style="padding:8px 0;font-weight:600;color:#635BFF;">${fmt(price)}</td></tr>
        </table>
        <p style="color:#425466;">Please review the delivery and confirm completion to release payment to the seller.</p>
        ${btn(orderUrl, 'Review & Confirm →')}
      `),
    },
    completed: {
      to: sellerEmail,
      subject: `✅ Payment Released — ${serviceTitle}`,
      html: card(`
        <h2 style="color:#0A2540;margin-top:0;">Payment released! ✅</h2>
        <p style="color:#425466;">Hi <strong>${sellerName}</strong>, <strong>${buyerName}</strong> has confirmed delivery. Your earnings have been released.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#8898AA;">Service</td><td style="padding:8px 0;font-weight:600;color:#0A2540;">${serviceTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#8898AA;">Your Earnings</td><td style="padding:8px 0;font-weight:700;color:#0EA878;">${fmt(Math.round(price * 0.9))}</td></tr>
        </table>
        <p style="color:#425466;">Great work! Don't forget to ask your buyer for a review.</p>
        ${btn(orderUrl, 'View Order →')}
      `),
    },
    disputed_buyer: {
      to: buyerEmail,
      subject: `⚠️ Dispute Opened — ${serviceTitle}`,
      html: card(`
        <h2 style="color:#0A2540;margin-top:0;">Your dispute has been received ⚠️</h2>
        <p style="color:#425466;">Hi <strong>${buyerName}</strong>, we've received your dispute for the order below. Our team will review and get back to you shortly.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#8898AA;">Service</td><td style="padding:8px 0;font-weight:600;color:#0A2540;">${serviceTitle}</td></tr>
        </table>
        ${btn(orderUrl, 'View Dispute →')}
      `),
    },
    disputed_seller: {
      to: sellerEmail,
      subject: `⚠️ Dispute Raised — ${serviceTitle}`,
      html: card(`
        <h2 style="color:#0A2540;margin-top:0;">A dispute has been raised ⚠️</h2>
        <p style="color:#425466;">Hi <strong>${sellerName}</strong>, <strong>${buyerName}</strong> has opened a dispute on your order. Our team will review the situation.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#8898AA;">Service</td><td style="padding:8px 0;font-weight:600;color:#0A2540;">${serviceTitle}</td></tr>
        </table>
        ${btn(orderUrl, 'View Dispute →')}
      `),
    },
  };

  const send = async () => {
    try {
      if (type === 'disputed') {
        await Promise.all([
          sendEmail({ email: buyerEmail, subject: templates.disputed_buyer.subject, html: templates.disputed_buyer.html, message: `Order disputed: ${serviceTitle}` }),
          sendEmail({ email: sellerEmail, subject: templates.disputed_seller.subject, html: templates.disputed_seller.html, message: `Order disputed: ${serviceTitle}` }),
        ]);
      } else {
        const tpl = templates[type];
        if (tpl) await sendEmail({ email: tpl.to, subject: tpl.subject, html: tpl.html, message: tpl.subject });
      }
    } catch (err) {
      console.error(`[OrderEmail] Failed to send '${type}' email:`, err.message);
    }
  };

  send(); // non-blocking fire-and-forget
};

// ── Helpers ──────────────────────────────────────────────────

const mapOrder = (row, currentUserId = null) => {
  if (!row) return null;
  const { service, buyer, seller, review, ...order } = row;

  const isSendiYou = service?.category === 'SendiYou';
  const isMutualReveal = !!order.buyer_revealed && !!order.seller_revealed;

  let mappedBuyer = buyer ? {
    _id: buyer.id,
    name: buyer.name,
    email: buyer.email,
    avatar: { public_id: buyer.avatar_public_id || '', url: buyer.avatar_url || '' },
    phone: buyer.phone,
    isPhoneVerified: buyer.is_phone_verified,
  } : undefined;

  let mappedSeller = seller ? {
    _id: seller.id,
    name: seller.name,
    email: seller.email,
    avatar: { public_id: seller.avatar_public_id || '', url: seller.avatar_url || '' },
    department: seller.department,
    phone: seller.phone,
    isPhoneVerified: seller.is_phone_verified,
    upiId: seller.upi_id || null,
  } : undefined;

  // Masking for SendiYou if NOT mutually revealed
  if (isSendiYou && !isMutualReveal) {
    if (currentUserId) {
      if (order.buyer_id === currentUserId) {
        // Viewing as buyer -> mask the seller
        if (mappedSeller) {
          mappedSeller = {
            _id: seller.id,
            name: service.display_name || 'Anonymous Poster',
            avatar: { public_id: '', url: '' },
            department: 'Secret',
            phone: '',
            isPhoneVerified: false,
            email: '',
          };
        }
      } else if (order.seller_id === currentUserId) {
        // Viewing as seller -> mask the buyer
        if (mappedBuyer) {
          mappedBuyer = {
            _id: buyer.id,
            name: 'SendiYou Match',
            avatar: { public_id: '', url: '' },
            phone: '',
            isPhoneVerified: false,
            email: '',
          };
        }
      } else {
        // Third-party/admin -> mask both
        if (mappedSeller) {
          mappedSeller = {
            _id: seller.id,
            name: service.display_name || 'Anonymous Poster',
            avatar: { public_id: '', url: '' },
            department: 'Secret',
            phone: '',
            isPhoneVerified: false,
            email: '',
          };
        }
        if (mappedBuyer) {
          mappedBuyer = {
            _id: buyer.id,
            name: 'SendiYou Match',
            avatar: { public_id: '', url: '' },
            phone: '',
            isPhoneVerified: false,
            email: '',
          };
        }
      }
    } else {
      // No currentUserId -> mask both
      if (mappedSeller) {
        mappedSeller = {
          _id: seller.id,
          name: service.display_name || 'Anonymous Poster',
          avatar: { public_id: '', url: '' },
          department: 'Secret',
          phone: '',
          isPhoneVerified: false,
          email: '',
        };
      }
      if (mappedBuyer) {
        mappedBuyer = {
          _id: buyer.id,
          name: 'SendiYou Match',
          avatar: { public_id: '', url: '' },
          phone: '',
          isPhoneVerified: false,
          email: '',
        };
      }
    }
  }

  // Also mask phone numbers from top-level fields for SendiYou pre-mutual reveal
  const showPhone = !isSendiYou || isMutualReveal;
  const buyerPhoneVal = showPhone ? (buyer?.phone || null) : null;
  const buyerPhoneVerifiedVal = showPhone ? (buyer?.is_phone_verified || false) : false;

  return {
    ...order,
    _id: order.id,
    serviceId: order.service_id,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
    platformFee: order.platform_fee,
    sellerEarnings: order.seller_earnings,
    razorpayOrderId: order.razorpay_order_id,
    razorpayPaymentId: order.razorpay_payment_id,
    requirements: order.requirements,
    deliveryNote: order.delivery_note,
    disputeReason: order.dispute_reason,
    isReviewed: order.is_reviewed,
    isNegotiable: !!order.is_negotiable,
    buyerPaid: !!order.buyer_paid,
    sellerPaid: !!order.seller_paid,
    buyerResult: order.buyer_result || null,
    sellerResult: order.seller_result || null,
    winnerId: order.winner_id || null,
    winnerEarnings: order.winner_earnings || 0,
    sellerRazorpayOrderId: order.seller_razorpay_order_id || '',
    sellerRazorpayPaymentId: order.seller_razorpay_payment_id || '',
    deliveredAt: order.delivered_at,
    completedAt: order.completed_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    buyerRevealed: !!order.buyer_revealed,
    sellerRevealed: !!order.seller_revealed,
    revealedIds: order.revealed_ids || [],
    paymentMethod: order.payment_method || 'razorpay',
    manualPaymentStatus: order.manual_payment_status || null,
    review: (review && review.length > 0) ? {
      rating: review[0].rating,
      comment: review[0].comment,
      createdAt: review[0].created_at
    } : null,
    service: service ? {
      _id: service.id,
      title: service.title,
      price: service.price,
      deliveryDays: service.delivery_days,
      images: service.images,
      category: service.category,
      expiresAt: service.expires_at,
      preferredGender: service.preferred_gender,
      identityHidden: service.identity_hidden,
      displayName: service.display_name,
      acceptedById: service.accepted_by_id,
      groupSize: service.group_size || 1,
    } : undefined,
    buyer: mappedBuyer,
    seller: mappedSeller,
    buyerPhone: buyerPhoneVal,
    buyerPhoneVerified: buyerPhoneVerifiedVal,
    buyerIds: order.buyer_ids || [],
  };
};

const getCommissionRate = (rank) => {
  if (rank === 'gold') return 0.03;
  if (rank === 'silver') return 0.06;
  return 0.10;
};

// ─────────────────────────────────────────────────────────────
// POST /api/orders — place a new order (protected)
// ─────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { serviceId, requirements } = req.body;

    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select(`
        id, seller_id, price, is_active, is_negotiable,
        seller:users!seller_id(rank)
      `)
      .eq('id', serviceId)
      .maybeSingle();

    if (svcErr || !service || !service.is_active) {
      if (svcErr) console.error('[POST /orders] Supabase error fetching service:', svcErr);
      return res.status(404).json({ success: false, message: 'Service not found', error: svcErr?.message });
    }

    if (service.seller_id === req.user._id)
      return res.status(400).json({ success: false, message: 'You cannot order your own service' });

    const price = service.price;
    const sellerRank = (service.seller && service.seller.rank) ? service.seller.rank : 'bronze';
    const commissionRate = getCommissionRate(sellerRank);
    const platformFee = Math.round(price * commissionRate);
    const sellerEarnings = price - platformFee;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        service_id: service.id,
        buyer_id: req.user._id,
        seller_id: service.seller_id,
        price,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        requirements: requirements || '',
        status: service.is_negotiable ? 'pending_negotiation' : 'pending',
        is_negotiable: !!service.is_negotiable,
      })
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified)
      `)
      .single();

    if (error) throw error;
    const mapped = mapOrder(order, req.user._id);
    // Notify seller about new order (non-blocking)
    if (mapped.seller?.email && mapped.buyer?.name) {
      sendOrderEmail('placed', {
        buyerName: mapped.buyer.name,
        buyerEmail: mapped.buyer.email,
        sellerName: mapped.seller.name,
        sellerEmail: mapped.seller.email,
        serviceTitle: mapped.service?.title || 'Your Service',
        orderId: mapped._id,
        price: mapped.price,
      });
      // In-app notification for seller
      createNotification({
        userId: mapped.seller._id,
        type: 'order_placed',
        title: '🛒 New Order Received!',
        body: `${mapped.buyer.name} placed an order for "${mapped.service?.title || 'your service'}".`,
        link: `/orders/${mapped._id}`,
      });
    }
    res.status(201).json({ success: true, order: mapped });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/set-price — seller sets negotiated price
// ─────────────────────────────────────────────────────────────
router.put('/:id/set-price', protect, async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || price < 50) return res.status(400).json({ success: false, message: 'Invalid price amount. Minimum ₹50.' });

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, seller_id, status, is_negotiable,
        seller:users!seller_id(rank)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller_id !== req.user._id) return res.status(403).json({ success: false, message: 'Only the seller can set the price' });
    if (order.status !== 'pending_negotiation' && order.status !== 'pending') return res.status(400).json({ success: false, message: 'Order is no longer pending' });
    if (!order.is_negotiable) return res.status(400).json({ success: false, message: 'This order is not negotiable' });

    const newPrice = Number(price);
    const sellerRank = (order.seller && order.seller.rank) ? order.seller.rank : 'bronze';
    const commissionRate = getCommissionRate(sellerRank);
    const platformFee = Math.round(newPrice * commissionRate);
    const sellerEarnings = newPrice - platformFee;

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        price: newPrice,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings
      })
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified)
      `)
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, order: mapOrder(updated, req.user._id) });
  } catch (error) {
    console.error('Set price error:', error);
    res.status(500).json({ success: false, message: 'Server error setting price' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/orders — list all orders for current user
// ─────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const selectFields = `
      *,
      service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
      buyer:users!buyer_id(id, name, avatar_url, avatar_public_id),
      seller:users!seller_id(id, name, avatar_url, avatar_public_id)
    `;

    // Query 1: orders where user is direct buyer or seller
    const { data: directOrders, error: e1 } = await supabase
      .from('orders')
      .select(selectFields)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (e1) throw e1;

    // Query 2: orders where user joined as a group member (buyer_ids array)
    const { data: groupOrders, error: e2 } = await supabase
      .from('orders')
      .select(selectFields)
      .contains('buyer_ids', [userId])
      .order('created_at', { ascending: false });
    if (e2) throw e2;

    // Merge and deduplicate by id
    const seen = new Set();
    const allOrders = [...(directOrders || []), ...(groupOrders || [])].filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({ success: true, orders: allOrders.map(o => mapOrder(o, userId)) });
  } catch (error) {
    console.error('GET /orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id — single order detail
// ─────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, department, phone, is_phone_verified, upi_id),
        review:reviews(rating, comment, created_at)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isParty =
      order.buyer_id === req.user._id ||
      order.seller_id === req.user._id ||
      (order.buyer_ids || []).includes(req.user._id);
    if (!isParty && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied' });

    // Fetch associated payout (if any)
    const { data: payout } = await supabase
      .from('payouts')
      .select('id, status, amount, upi_id, paid_at')
      .eq('order_id', order.id)
      .maybeSingle();

    const mapped = mapOrder(order, req.user._id);
    if (mapped) {
      mapped.payout = payout;
      mapped.sellerUpiId = order.seller?.upi_id || null;
    }

    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/deliver — seller marks as delivered
// ─────────────────────────────────────────────────────────────
router.put('/:id/deliver', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, seller_id, buyer_id, status, price,
        service:services!service_id(title),
        buyer:users!buyer_id(id, name, email)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'Only the seller can mark delivery' });
    if (order.status !== 'inProgress')
      return res.status(400).json({ success: false, message: 'Order must be in progress to deliver' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString(), delivery_note: req.body.deliveryNote || '' })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    // Notify buyer that order was delivered (non-blocking)
    if (order.buyer?.email) {
      sendOrderEmail('delivered', {
        buyerName: order.buyer.name,
        buyerEmail: order.buyer.email,
        sellerName: req.user.name,
        sellerEmail: req.user.email,
        serviceTitle: order.service?.title || 'Service',
        orderId: req.params.id,
        price: order.price,
      });
      // In-app notification for buyer
      createNotification({
        userId: order.buyer.id,
        type: 'order_delivered',
        title: '📦 Order Delivered!',
        body: `"${order.service?.title || 'Your order'}" has been delivered. Please review and confirm.`,
        link: `/orders/${req.params.id}`,
      });
    }
    res.status(200).json({ success: true, order: mapOrder(updated, req.user._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/complete — buyer confirms delivery
// ─────────────────────────────────────────────────────────────
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, status, price, seller_earnings,
        service:services!service_id(title, category),
        seller:users!seller_id(id, name, email, upi_id, rank)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'Only the buyer can confirm delivery' });
    if (order.status !== 'delivered')
      return res.status(400).json({ success: false, message: 'Order must be delivered first' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    // ── Auto-create payout record (synchronous) ──────────────
    const sellerUpiId = order.seller?.upi_id;
    const payoutAmount = order.seller_earnings || Math.round(order.price * 0.9);
    const shortOrderId = String(req.params.id).slice(-8).toUpperCase();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '25se02ml132@ppsu.ac.in';

    // Insert payout and select it back
    let payout = null;
    try {
      const { data: payData, error: payErr } = await supabase
        .from('payouts')
        .upsert({
          order_id: req.params.id,
          seller_id: order.seller_id,
          amount: payoutAmount,
          upi_id: sellerUpiId || 'NOT SET',
          status: 'pending',
        }, { onConflict: 'order_id' })
        .select('id, status, amount, upi_id, paid_at')
        .maybeSingle();

      if (payErr) throw payErr;
      payout = payData;
    } catch (payErr) {
      console.error('[Orders] Payout insert error:', payErr.message);
    }

    // Notify seller that order is completed (generic notification, NO payment/payout mention)
    if (order.seller?.email) {
      // We do NOT send sendOrderEmail('completed', ...) anymore to prevent sending a payment email prematurely.
      
      // Send a generic in-app notification about order completion
      createNotification({
        userId: order.seller.id,
        type: 'order_completed',
        title: '✅ Order Completed!',
        body: `"${order.service?.title || 'Your service'}" has been successfully completed. Buyer confirmed delivery.`,
        link: `/orders/${req.params.id}`,
      });
    }

    // Email admin about new pending payout (non-blocking)
    sendEmail({
      email: ADMIN_EMAIL,
      subject: `💰 New Payout Pending — Cosen Admin`,
      message: `Order #${shortOrderId} completed.\n\nSeller: ${order.seller?.name} (${order.seller?.email})\nAmount: ₹${payoutAmount.toLocaleString('en-IN')}\nUPI ID: ${sellerUpiId || 'NOT SET — seller must update profile'}\nService: ${order.service?.title}\n\nLogin to admin panel to mark as paid:\nhttps://cosen.online/admin/payouts`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#635BFF">💰 New Payout Pending</h2>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#6B7280">Seller</td><td style="font-weight:600;color:#1A202C">${order.seller?.name} &lt;${order.seller?.email}&gt;</td></tr>
              <tr><td style="padding:6px 0;color:#6B7280">Amount</td><td style="font-weight:700;font-size:18px;color:#16A34A">₹${payoutAmount.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:6px 0;color:#6B7280">UPI ID</td><td style="font-weight:600;color:${sellerUpiId ? '#1A202C' : '#EF4444'}">${sellerUpiId || '⚠️ Not Set'}</td></tr>
              <tr><td style="padding:6px 0;color:#6B7280">Service</td><td style="color:#4A5568">${order.service?.title}</td></tr>
              <tr><td style="padding:6px 0;color:#6B7280">Order ID</td><td style="font-family:monospace;color:#6B7280">#${shortOrderId}</td></tr>
            </table>
          </div>
          <a href="https://cosen.online/admin/payouts" style="display:inline-block;background:#635BFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open Admin Panel →</a>
        </div>`,
    }).catch(e => console.error('[Orders] Admin payout email error:', e.message));

    const mapped = mapOrder(updated, req.user._id);
    if (mapped) {
      mapped.payout = payout;
    }

    // ── Rank Progression Check (non-blocking) ──────────────
    if (order.service?.category !== 'SendiYou') {
      (async () => {
        try {
          const { data: completedOrders, error: countErr } = await supabase
            .from('orders')
            .select('id, service:services(category)')
            .eq('seller_id', order.seller_id)
            .eq('status', 'completed');
            
          if (!countErr && completedOrders) {
            const validOrdersCount = completedOrders.filter(o => o.service && o.service.category !== 'SendiYou').length;
            
            const currentRank = order.seller?.rank || 'bronze';
            let newRank = currentRank;

            if (validOrdersCount >= 200) newRank = 'gold';
            else if (validOrdersCount >= 100 && currentRank !== 'gold') newRank = 'silver';

            if (newRank !== currentRank) {
              await supabase.from('users').update({ rank: newRank }).eq('id', order.seller_id);
              
              const feePct = newRank === 'gold' ? '3%' : '6%';
              
              // In-app Notification
              createNotification({
                userId: order.seller_id,
                type: 'rank_upgrade',
                title: `🏆 Rank Upgraded to ${newRank.toUpperCase()}!`,
                body: `Congratulations! You've completed ${validOrdersCount} orders. Your platform fee is now reduced to ${feePct}.`,
                link: `/profile`,
              });

              // Email Notification
              if (order.seller?.email) {
                sendEmail({
                  email: order.seller.email,
                  subject: `🎉 Congratulations! You are now a ${newRank.toUpperCase()} rank seller!`,
                  html: `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;text-align:center;">
                      <div style="font-size:48px;margin-bottom:16px;">🏆</div>
                      <h2 style="color:#635BFF">You leveled up to ${newRank.toUpperCase()}!</h2>
                      <p style="color:#4A5568;font-size:16px;line-height:1.5;">
                        Hi ${order.seller.name},<br/><br/>
                        You've successfully completed <strong>${validOrdersCount}</strong> valid orders!<br/>
                        As a reward for your amazing work, your platform fees have been reduced to <strong>${feePct}</strong>!
                      </p>
                      <a href="https://cosen.online/profile" style="display:inline-block;margin-top:24px;background:#635BFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Your Profile →</a>
                    </div>
                  `
                }).catch(e => console.error('[Orders] Rank email error:', e.message));
              }
            }
          }
        } catch (err) {
          console.error('[Orders] Rank progression error:', err.message);
        }
      })();
    }

    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/dispute — buyer opens a dispute
// ─────────────────────────────────────────────────────────────
router.put('/:id/dispute', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, status, price,
        service:services!service_id(title),
        seller:users!seller_id(id, name, email)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'Only the buyer can open a dispute' });
    if (!['inProgress', 'delivered'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Cannot dispute this order' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: 'disputed', dispute_reason: req.body.reason || 'No reason provided' })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    // Notify both buyer and seller about dispute (non-blocking)
    sendOrderEmail('disputed', {
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      sellerName: order.seller?.name || 'Seller',
      sellerEmail: order.seller?.email,
      serviceTitle: order.service?.title || 'Service',
      orderId: req.params.id,
      price: order.price,
    });
    // In-app notifications for both parties
    createNotification({
      userId: req.user._id,
      type: 'order_disputed',
      title: '⚠️ Dispute Opened',
      body: `Your dispute for "${order.service?.title || 'the order'}" has been received. We will review it shortly.`,
      link: `/orders/${req.params.id}`,
    });
    if (order.seller?.id) {
      createNotification({
        userId: order.seller.id,
        type: 'order_disputed',
        title: '⚠️ Dispute Raised',
        body: `${req.user.name} raised a dispute on "${order.service?.title || 'your order'}".`,
        link: `/orders/${req.params.id}`,
      });
    }
    res.status(200).json({ success: true, order: mapOrder(updated, req.user._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/vote-result — vote match result (protected)
// ─────────────────────────────────────────────────────────────
router.put('/:id/vote-result', protect, async (req, res) => {
  try {
    const { choice } = req.body; // 'win' or 'lose'
    if (choice !== 'win' && choice !== 'lose') {
      return res.status(400).json({ success: false, message: 'Invalid choice. Must be "win" or "lose"' });
    }

    // 1. Fetch current order with service and users details
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category),
        buyer:users!buyer_id(id, name, email),
        seller:users!seller_id(id, name, email)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.service?.category !== 'Playground') {
      return res.status(400).json({ success: false, message: 'This operation is only valid for Playground services.' });
    }
    // Only allow voting when BOTH entry fees are paid (status = inProgress)
    if (order.status !== 'inProgress' || !order.buyer_paid || !order.seller_paid) {
      return res.status(400).json({ success: false, message: 'Match result voting is only available after both players have paid their entry fees.' });
    }

    const isBuyer = order.buyer_id === req.user._id;
    const isSeller = order.seller_id === req.user._id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this match.' });
    }

    // 2. Set the vote for the respective party
    const updates = {};
    if (isBuyer) updates.buyer_result = choice;
    if (isSeller) updates.seller_result = choice;

    // Apply immediate update
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category),
        buyer:users!buyer_id(id, name, email),
        seller:users!seller_id(id, name, email)
      `)
      .single();

    if (updateErr) throw updateErr;

    const bRes = updatedOrder.buyer_result;
    const sRes = updatedOrder.seller_result;

    // 3. Resolve conflict / agreement if both voted
    if (bRes && sRes) {
      if (bRes === sRes) {
        // Conflict! Reset votes to null
        const { data: resetOrder, error: resetErr } = await supabase
          .from('orders')
          .update({ buyer_result: null, seller_result: null })
          .eq('id', req.params.id)
          .select(`
            *,
            service:services!service_id(id, title, price, delivery_days, category),
            buyer:users!buyer_id(id, name, email),
            seller:users!seller_id(id, name, email)
          `)
          .single();

        if (resetErr) throw resetErr;

        // Notify both parties about conflict
        createNotification({
          userId: order.buyer_id,
          type: 'order_disputed',
          title: '⚠️ Match Result Conflict!',
          body: 'Conflict detected! You both selected the same match result. Please select the correct result.',
          link: `/orders/${order.id}`,
        });
        createNotification({
          userId: order.seller_id,
          type: 'order_disputed',
          title: '⚠️ Match Result Conflict!',
          body: 'Conflict detected! You both selected the same match result. Please select the correct result.',
          link: `/orders/${order.id}`,
        });

        return res.status(200).json({
          success: true,
          conflict: true,
          message: 'please select the right option, do not select the same option',
          order: mapOrder(resetOrder, req.user._id)
        });
      } else {
        // Agreement! One is 'win', one is 'lose'
        const winnerId = bRes === 'win' ? order.buyer_id : order.seller_id;
        const loserId = bRes === 'lose' ? order.buyer_id : order.seller_id;

        const { data: finalOrder, error: finalErr } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            winner_id: winnerId,
            completed_at: new Date().toISOString()
          })
          .eq('id', req.params.id)
          .select(`
            *,
            service:services!service_id(id, title, price, delivery_days, category),
            buyer:users!buyer_id(id, name, email),
            seller:users!seller_id(id, name, email)
          `)
          .single();

        if (finalErr) throw finalErr;

        // Notify both parties about match outcome
        createNotification({
          userId: winnerId,
          type: 'order_completed',
          title: '🏆 Match Won! 🎉',
          body: `Congratulations! Match verified and ₹${finalOrder.winner_earnings} prize pool credited to your dashboard.`,
          link: `/orders/${order.id}`,
        });
        createNotification({
          userId: loserId,
          type: 'order_completed',
          title: '🔴 Match Lost',
          body: 'Match verified. Better luck next time!',
          link: `/orders/${order.id}`,
        });

        return res.status(200).json({
          success: true,
          conflict: false,
          order: mapOrder(finalOrder, req.user._id)
        });
      }
    }

    // If only one voted, notify the other party to cast their vote
    const waitingForId = isBuyer ? order.seller_id : order.buyer_id;
    const voterName = isBuyer ? order.buyer?.name : order.seller?.name;
    createNotification({
      userId: waitingForId,
      type: 'order_message',
      title: '🎮 Your Opponent Voted!',
      body: `${voterName || 'Your opponent'} declared their match result. Go cast your vote now to settle the match!`,
      link: `/orders/${order.id}`,
    });

    res.status(200).json({ success: true, conflict: false, order: mapOrder(updatedOrder, req.user._id) });
  } catch (error) {
    console.error('Vote match result error:', error);
    res.status(500).json({ success: false, message: 'Server error voting result' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/choose-manual-payment — buyer selects manual UPI payment
// ─────────────────────────────────────────────────────────────
router.put('/:id/choose-manual-payment', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, status, price, is_negotiable,
        service:services!service_id(title),
        seller:users!seller_id(id, name, upi_id)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer_id !== req.user._id) return res.status(403).json({ success: false, message: 'Only the buyer can choose payment method' });
    if (!['pending', 'pending_negotiation'].includes(order.status)) return res.status(400).json({ success: false, message: 'Order is not in a payable state' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        payment_method: 'manual',
        manual_payment_status: 'awaiting_payment',
      })
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified, upi_id)
      `)
      .single();

    if (error) throw error;

    // Notify seller
    createNotification({
      userId: order.seller_id,
      type: 'order_placed',
      title: '📱 Manual Payment Selected',
      body: `Buyer chose to pay ₹${order.price} manually via UPI for "${order.service?.title || 'your service'}".`,
      link: `/orders/${req.params.id}`,
    });

    const mapped = mapOrder(updated, req.user._id);
    // Attach seller UPI for frontend display
    mapped.sellerUpiId = updated.seller?.upi_id || null;
    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    console.error('Choose manual payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/buyer-claimed-paid — buyer says they have paid
// ─────────────────────────────────────────────────────────────
router.put('/:id/buyer-claimed-paid', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, price, manual_payment_status,
        service:services!service_id(title),
        buyer:users!buyer_id(name)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer_id !== req.user._id) return res.status(403).json({ success: false, message: 'Only the buyer can claim payment' });
    if (order.manual_payment_status !== 'awaiting_payment') return res.status(400).json({ success: false, message: 'Invalid payment state' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ manual_payment_status: 'buyer_claimed_paid' })
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified, upi_id)
      `)
      .single();

    if (error) throw error;

    // Notify seller
    createNotification({
      userId: order.seller_id,
      type: 'order_placed',
      title: '💰 Payment Claimed',
      body: `${order.buyer?.name || 'Buyer'} says they have paid ₹${order.price} via UPI. Please verify in your UPI app.`,
      link: `/orders/${req.params.id}`,
    });

    const mapped = mapOrder(updated, req.user._id);
    mapped.sellerUpiId = updated.seller?.upi_id || null;
    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    console.error('Buyer claimed paid error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/seller-confirm-payment — seller confirms receipt
// ─────────────────────────────────────────────────────────────
router.put('/:id/seller-confirm-payment', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, price, manual_payment_status,
        service:services!service_id(title),
        seller:users!seller_id(name)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller_id !== req.user._id) return res.status(403).json({ success: false, message: 'Only the seller can confirm payment' });
    if (order.manual_payment_status !== 'buyer_claimed_paid') return res.status(400).json({ success: false, message: 'No pending payment claim to confirm' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        manual_payment_status: 'seller_confirmed',
        status: 'inProgress',
      })
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified, upi_id)
      `)
      .single();

    if (error) throw error;

    // Notify buyer
    createNotification({
      userId: order.buyer_id,
      type: 'order_placed',
      title: '✅ Payment Confirmed!',
      body: `${order.seller?.name || 'Seller'} has received your payment and is now working on your order.`,
      link: `/orders/${req.params.id}`,
    });

    const mapped = mapOrder(updated, req.user._id);
    mapped.sellerUpiId = updated.seller?.upi_id || null;
    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    console.error('Seller confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/orders/:id/seller-reject-payment — seller says not received
// ─────────────────────────────────────────────────────────────
router.put('/:id/seller-reject-payment', protect, async (req, res) => {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, seller_id, price, manual_payment_status,
        service:services!service_id(title),
        seller:users!seller_id(name)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller_id !== req.user._id) return res.status(403).json({ success: false, message: 'Only the seller can reject payment' });
    if (order.manual_payment_status !== 'buyer_claimed_paid') return res.status(400).json({ success: false, message: 'No pending payment claim to reject' });

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ manual_payment_status: 'awaiting_payment' })
      .eq('id', req.params.id)
      .select(`
        *,
        service:services!service_id(id, title, price, delivery_days, category, images, expires_at, preferred_gender, identity_hidden, display_name, accepted_by_id, group_size),
        buyer:users!buyer_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified),
        seller:users!seller_id(id, name, email, avatar_url, avatar_public_id, phone, is_phone_verified, upi_id)
      `)
      .single();

    if (error) throw error;

    // Notify buyer
    createNotification({
      userId: order.buyer_id,
      type: 'order_placed',
      title: '❌ Payment Not Received',
      body: `${order.seller?.name || 'Seller'} hasn't received the payment yet. Please check your UPI app and try again.`,
      link: `/orders/${req.params.id}`,
    });

    const mapped = mapOrder(updated, req.user._id);
    mapped.sellerUpiId = updated.seller?.upi_id || null;
    res.status(200).json({ success: true, order: mapped });
  } catch (error) {
    console.error('Seller reject payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.mapOrder = mapOrder;
module.exports = router;
