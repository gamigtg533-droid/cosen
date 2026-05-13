const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');
const { protect } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const sendEmail = require('../utils/sendEmail');



// ── Helpers ──────────────────────────────────────────────────

// Map Supabase row id → _id for frontend compatibility
const mapId = (row) => (row ? { ...row, _id: row.id } : null);

// Build the public user object sent in auth responses
const buildUserPayload = (u) => ({
  _id: u.id,
  name: u.name,
  email: u.email,
  avatar: { public_id: u.avatar_public_id || '', url: u.avatar_url || '' },
  department: u.department,
  yearOfStudy: u.year_of_study,
  bio: u.bio,
  skills: u.skills,
  role: u.role,
  rating: u.rating,
  reviewCount: u.review_count,
  isEmailVerified: u.is_email_verified,
  dob: u.dob,
  idCardImageUrl: u.id_card_image_url,
  instagramUrl: u.instagram_url,
  facebookUrl: u.facebook_url,
  youtubeUrl: u.youtube_url,
  xUrl: u.x_url,
  platformAgreementAccepted: u.platform_agreement_accepted,
  isOnboardingComplete: u.is_onboarding_complete,
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user.id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: buildUserPayload(user),
  });
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, yearOfStudy, bio, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only university emails are allowed (.edu or .ac.in)',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check if email already in use
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const authExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Map wizard role value to DB role
    const dbRole = role === 'seller' ? 'seller' : role === 'buyer' ? 'buyer' : 'both';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        department: department || '',
        year_of_study: yearOfStudy || '',
        bio: bio || '',
        role: dbRole,
        is_email_verified: false,
        is_onboarding_complete: false,
        email_verification_token: hashedOtp,
        email_verification_expire: authExpire,
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ Send response IMMEDIATELY — don't block on email delivery
    sendToken(user, 201, res, 'Account created! Please check your email for the verification OTP.');

    // 🔥 Send OTP email in background (non-blocking)
    const message = `Welcome to Cosen!\n\nYour email verification code is: ${otp}\n\nThis code will expire in 15 minutes.`;
    sendEmail({
      email: user.email,
      subject: 'Cosen Email Verification - OTP Code',
      message
    }).catch((err) => {
      console.error('Background email send failed. OTP was:', otp, err.message);
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});


// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    sendToken(user, 200, res, 'Logged in successfully');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email?.toLowerCase()?.trim())
      .maybeSingle();

    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expire = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await supabase
      .from('users')
      .update({ reset_password_token: hashedToken, reset_password_expire: expire })
      .eq('id', user.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // ✅ Send response immediately — don't block on email
    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });

    // 🔥 Send email in background
    sendEmail({
      email: user.email,
      subject: 'Cosen - Password Reset Link (valid for 5 minutes)',
      message: `You requested a password reset for your Cosen account.\n\nClick this link to reset your password:\n${resetUrl}\n\n⚠️ This link is valid for only 5 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#0A2540;margin-bottom:8px;">Reset your Cosen password</h2>
          <p style="color:#425466;">Click the button below to set a new password for your account.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#635BFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
          <p style="color:#F87171;font-size:13px;">⚠️ This link expires in <strong>5 minutes</strong>. After that you will need to request a new one.</p>
          <p style="color:#8898AA;font-size:12px;margin-top:16px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    }).catch((err) => {
      console.error('Background forgot-password email failed:', err.message);
      // Rollback token silently since response already sent
      supabase
        .from('users')
        .update({ reset_password_token: null, reset_password_expire: null })
        .eq('id', user.id)
        .then(() => console.log('Reset token rolled back due to email failure.'));
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});


// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('reset_password_token', hashedToken)
      .gt('reset_password_expire', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expire: null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    sendToken(updatedUser, 200, res, 'Password reset successful. You are now logged in.');
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/google
// ─────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email || !/^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only university emails are allowed (.edu or .ac.in)',
      });
    }

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!user) {
      // Create new user via Google
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: name,
          email: email.toLowerCase(),
          password: '', // oauth users don't need a local password right now
          avatar_url: picture || '',
          is_email_verified: true,
          is_onboarding_complete: false
        })
        .select()
        .single();

      if (error) throw error;
      user = newUser;
    }

    sendToken(user, 200, res, 'Google Login successful');
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google Authentication.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/onboarding
// ─────────────────────────────────────────────────────────────
router.put('/onboarding', protect, async (req, res) => {
  try {
    const {
      dob,
      department,
      yearOfStudy,
      idCardImageUrl,
      avatarUrl,
      instagramUrl,
      facebookUrl,
      youtubeUrl,
      xUrl,
      platformAgreementAccepted
    } = req.body;

    if (!platformAgreementAccepted) {
      return res.status(400).json({ success: false, message: 'You must accept the platform agreement.' });
    }

    if (!dob) {
      return res.status(400).json({ success: false, message: 'Date of Birth is required.' });
    }

    // Phone must be verified before completing onboarding
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_phone_verified, role')
      .eq('id', req.user._id)
      .single();

    if (!currentUser?.is_phone_verified) {
      return res.status(400).json({ success: false, message: 'Phone number must be verified before completing your profile.' });
    }

    // Profile photo is mandatory for sellers and both
    if ((currentUser.role === 'seller' || currentUser.role === 'both') && !avatarUrl) {
      return res.status(400).json({ success: false, message: 'A profile photo is required for sellers. Please upload one.' });
    }

    const updateData = {
      dob,
      department: department || '',
      year_of_study: yearOfStudy || '',
      instagram_url: instagramUrl || '',
      facebook_url: facebookUrl || '',
      youtube_url: youtubeUrl || '',
      x_url: xUrl || '',
      platform_agreement_accepted: true,
      is_onboarding_complete: true
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user._id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully!',
      user: buildUserPayload(updatedUser)
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, message: 'Server error during onboarding.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────
router.post('/verify-otp', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.user._id)
      .eq('email_verification_token', hashedOtp)
      .gt('email_verification_expire', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        is_email_verified: true,
        email_verification_token: null,
        email_verification_expire: null
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      user: buildUserPayload(updatedUser)
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────
router.post('/resend-otp', protect, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, is_email_verified')
      .eq('id', req.user._id)
      .single();

    if (!user || user.is_email_verified) {
      return res.status(400).json({ success: false, message: 'User already verified or not found.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const authExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({
        email_verification_token: hashedOtp,
        email_verification_expire: authExpire
      })
      .eq('id', user.id);

    const message = `Welcome to Cosen!\n\nYour new email verification code is: ${otp}\n\nThis code will expire in 15 minutes.`;

    // ✅ Send response immediately
    res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });

    // 🔥 Send email in background
    sendEmail({
      email: user.email,
      subject: 'Cosen Email Verification - New OTP Code',
      message
    }).catch((err) => {
      console.error('Background resend-otp email failed. OTP was:', otp, err.message);
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during OTP resend.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/send-phone-otp
// ─────────────────────────────────────────────────────────────
router.post('/send-phone-otp', protect, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Check if phone is already verified by another user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .eq('is_phone_verified', true)
      .neq('id', req.user._id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Update DB
    await supabase
      .from('users')
      .update({
        phone: phone,
        phone_otp_token: hashedOtp,
        phone_otp_expire: expire,
      })
      .eq('id', req.user._id);

    // Send SMS via Fast2SMS
    const sendSms = require('../utils/sendSms');
    await sendSms(phone, otp);

    res.status(200).json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Send Phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-phone-otp
// ─────────────────────────────────────────────────────────────
router.post('/verify-phone-otp', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.user._id)
      .eq('phone_otp_token', hashedOtp)
      .gt('phone_otp_expire', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    await supabase
      .from('users')
      .update({
        is_phone_verified: true,
        phone_otp_token: null,
        phone_otp_expire: null,
      })
      .eq('id', req.user._id);

    res.status(200).json({ success: true, message: 'Phone number verified successfully!' });
  } catch (error) {
    console.error('Verify Phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during phone verification.' });
  }
});

module.exports = router;
