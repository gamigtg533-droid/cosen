const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────

const mapSeller = (s) => s ? {
  _id: s.id,
  name: s.name,
  avatar: { public_id: s.avatar_public_id || '', url: s.avatar_url || '' },
  department: s.department,
  yearOfStudy: s.year_of_study,
  bio: s.bio,
  rating: s.rating,
  reviewCount: s.review_count,
  createdAt: s.created_at,
} : null;

const mapService = (row) => {
  if (!row) return null;
  const { seller, ...svc } = row;
  const isSendi = svc.category === 'SendiYou';
  const isHidden = !!svc.identity_hidden;

  let mappedSeller = mapSeller(seller);
  if (isSendi && isHidden && mappedSeller) {
    mappedSeller = {
      _id: null,
      name: svc.display_name || 'Anonymous',
      avatar: { public_id: '', url: '' },
      department: 'Secret',
      yearOfStudy: 'N/A',
      bio: 'This student has chosen to hide their identity.',
      rating: 5,
      reviewCount: 0,
      createdAt: null,
    };
  }

  return {
    ...svc,
    _id: svc.id,
    sellerId: svc.seller_id,
    deliveryDays: svc.delivery_days,
    subCategory: svc.sub_category || '',
    isNegotiable: !!svc.is_negotiable,
    isActive: svc.is_active,
    reviewCount: svc.review_count,
    coverImageUrl: svc.cover_image_url || '',
    portfolioImages: svc.portfolio_images || [],
    // SendiYou fields
    displayName: svc.display_name || null,
    preferredGender: svc.preferred_gender || null,
    identityHidden: isHidden,
    acceptedById: svc.accepted_by_id || null,
    expiresAt: svc.expires_at || null,
    createdAt: svc.created_at,
    updatedAt: svc.updated_at,
    seller: mappedSeller,
  };
};

// ─────────────────────────────────────────────────────────────
// GET /api/services — browse all active services (public)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('services')
      .select('*, seller:users!seller_id(id, name, avatar_url, avatar_public_id, department, year_of_study, rating, review_count)', { count: 'exact' })
      .eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (search) query = query.textSearch('fts', search, { type: 'websearch' });

    // For SendiYou: only show posts not yet accepted by anyone
    if (category === 'SendiYou') {
      query = query.is('accepted_by_id', null);
    }

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: services, error, count } = await query;
    if (error) throw error;

    // For identity-hidden SendiYou posts, mask the seller info
    const mapped = services.map(svc => {
      const m = mapService(svc);
      if (m.category === 'SendiYou' && m.identityHidden && m.seller) {
        m.seller = {
          ...m.seller,
          name: m.displayName || 'Anonymous',
          avatar: { url: '', public_id: '' },
          _id: null,
        };
      }
      return m;
    });

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      pages: Math.ceil(count / limit),
      services: mapped,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/services/user/:userId — services by a specific seller (public)
// ─────────────────────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    let query = supabase
      .from('services')
      .select('*, seller:users!seller_id(id, name, avatar_url, avatar_public_id, department, rating)')
      .eq('seller_id', req.params.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Hide identity-hidden SendiYou posts from public profile
    query = query.or('category.neq.SendiYou,identity_hidden.eq.false');

    const { data: services, error } = await query;
    if (error) throw error;
    res.status(200).json({ success: true, services: services.map(mapService) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/services/:id — single service detail (public)
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('*, seller:users!seller_id(id, name, avatar_url, avatar_public_id, department, year_of_study, bio, rating, review_count, created_at)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!service || !service.is_active) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({ success: true, service: mapService(service) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/services — create a new service (protected)
// ─────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user.is_onboarding_complete) {
      return res.status(403).json({ success: false, message: 'You must complete your profile onboarding before posting a service.' });
    }

    const { title, description, category, subCategory, isNegotiable, price, deliveryDays, tags, coverImageUrl, portfolioImages,
      // SendiYou specific fields
      displayName, preferredGender, identityHidden
    } = req.body;

    const isSendiYou = category === 'SendiYou';

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    if (!isSendiYou && (price == null || !deliveryDays)) {
      return res.status(400).json({ success: false, message: 'Price and delivery days are required' });
    }

    const validCategories = ['Study Helper', 'Tech & Coding', 'Art & Design', 'Food Friendship', 'Photography', 'Playground', 'SendiYou', 'Other Talents'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const insertData = {
      seller_id: req.user._id,
      title: title.trim(),
      description,
      category,
      sub_category: subCategory || null,
      is_negotiable: !!isNegotiable,
      price: isSendiYou ? 0 : Number(price),
      delivery_days: isSendiYou ? 7 : Number(deliveryDays),
      tags: tags || [],
      cover_image_url: coverImageUrl || '',
      portfolio_images: Array.isArray(portfolioImages) ? portfolioImages : [],
    };

    if (isSendiYou) {
      insertData.display_name = displayName || req.user.name;
      insertData.preferred_gender = preferredGender || 'Any';
      insertData.identity_hidden = !!identityHidden;
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert(insertData)
      .select('*, seller:users!seller_id(id, name, avatar_url, avatar_public_id, department, rating)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, service: mapService(service) });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/services/:id — update own service (protected)
// ─────────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { data: service, error: fetchErr } = await supabase
      .from('services')
      .select('id, seller_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.seller_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'You can only edit your own services' });

    const fieldMap = {
      title: 'title', description: 'description', category: 'category',
      subCategory: 'sub_category', isNegotiable: 'is_negotiable',
      price: 'price', deliveryDays: 'delivery_days', tags: 'tags', isActive: 'is_active',
      coverImageUrl: 'cover_image_url', portfolioImages: 'portfolio_images',
    };

    const updates = {};
    Object.entries(fieldMap).forEach(([bodyKey, dbKey]) => {
      if (req.body[bodyKey] !== undefined) updates[dbKey] = req.body[bodyKey];
    });

    const { data: updated, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, service: mapService(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/services/:id — soft-delete own service (protected)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const { data: service, error: fetchErr } = await supabase
      .from('services')
      .select('id, seller_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.seller_id !== req.user._id)
      return res.status(403).json({ success: false, message: 'You can only delete your own services' });

    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
