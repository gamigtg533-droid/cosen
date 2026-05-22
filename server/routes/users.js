const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');

// Helper: map Supabase column names → frontend field names
const mapUser = (u) => u ? {
  _id: u.id,
  name: u.name,
  email: u.email,
  avatar: { public_id: u.avatar_public_id || '', url: u.avatar_url || '' },
  bannerUrl: u.banner_url || '',
  department: u.department,
  yearOfStudy: u.year_of_study,
  bio: u.bio,
  skills: u.skills,
  role: u.role,
  gender: u.gender || null,
  rating: u.rating,
  reviewCount: u.review_count,
  isEmailVerified: u.is_email_verified,
  phone: u.phone || null,
  isPhoneVerified: u.is_phone_verified || false,
  createdAt: u.created_at,
  dob: u.dob,
  idCardImageUrl: u.id_card_image_url,
  instagramUrl: u.instagram_url,
  facebookUrl: u.facebook_url,
  youtubeUrl: u.youtube_url,
  xUrl: u.x_url,
  platformAgreementAccepted: u.platform_agreement_accepted,
  isOnboardingComplete: u.is_onboarding_complete,
} : null;

// GET /api/users/me — Get own profile (protected)
router.get('/me', protect, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, avatar_public_id, banner_url, department, year_of_study, bio, skills, role, gender, rating, review_count, is_email_verified, phone, is_phone_verified, created_at, dob, id_card_image_url, instagram_url, facebook_url, youtube_url, x_url, platform_agreement_accepted, is_onboarding_complete')
      .eq('id', req.user._id)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, user: mapUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/me — Update own profile (protected)
router.put('/me', protect, async (req, res) => {
  try {
    const fieldMap = {
      name: 'name',
      department: 'department',
      yearOfStudy: 'year_of_study',
      bio: 'bio',
      skills: 'skills',
      phone: 'phone',
      gender: 'gender',
      bannerUrl: 'banner_url',
      avatarUrl: 'avatar_url',
      instagramUrl: 'instagram_url',
      facebookUrl:  'facebook_url',
      youtubeUrl:   'youtube_url',
      xUrl:         'x_url',
    };

    const updates = {};
    Object.entries(fieldMap).forEach(([bodyKey, dbKey]) => {
      if (req.body[bodyKey] !== undefined) updates[dbKey] = req.body[bodyKey];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user._id)
      .select('id, name, email, avatar_url, avatar_public_id, banner_url, department, year_of_study, bio, skills, role, gender, rating, review_count, is_email_verified, phone, is_phone_verified, created_at, dob, id_card_image_url, instagram_url, facebook_url, youtube_url, x_url, platform_agreement_accepted, is_onboarding_complete')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, user: mapUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/:id — Get public profile of any user
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, avatar_public_id, banner_url, department, year_of_study, bio, skills, role, rating, review_count, is_email_verified, phone, is_phone_verified, created_at')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: mapUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
