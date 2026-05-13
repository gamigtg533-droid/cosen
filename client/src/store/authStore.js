import { create } from 'zustand';
import api from '../lib/api';

// Load persisted state from localStorage
const storedToken = localStorage.getItem('cosen_token') || null;
let storedUser = null;
try {
  const userStr = localStorage.getItem('cosen_user');
  if (userStr && userStr !== 'undefined') {
    storedUser = JSON.parse(userStr);
  }
} catch (e) {
  console.error("Failed to parse stored user from localStorage", e);
  localStorage.removeItem('cosen_user');
}

const useAuthStore = create((set, get) => ({
  user:    storedUser,
  token:   storedToken,
  loading: false,
  error:   null,

  // ── Register ───────────────────────────────────────────
  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('cosen_token', data.token);
      localStorage.setItem('cosen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // ── Login ──────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cosen_token', data.token);
      localStorage.setItem('cosen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // ── Logout ─────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('cosen_token');
    localStorage.removeItem('cosen_user');
    set({ user: null, token: null, error: null });
  },

  // ── Update profile in store after PUT /me ──────────────
  setUser: (user) => {
    if (user) {
      localStorage.setItem('cosen_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cosen_user');
    }
    set({ user });
  },

  // ── Google Login ───────────────────────────────────────
  loginWithGoogle: async (credential) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/google', { token: credential });
      localStorage.setItem('cosen_token', data.token);
      localStorage.setItem('cosen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // ── OTP Email Verification ─────────────────────────────
  verifyOtp: async (otp) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/verify-otp', { otp });
      localStorage.setItem('cosen_user', JSON.stringify(data.user));
      set({ user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  resendOtp: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/resend-otp');
      set({ loading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // ── Complete Onboarding ────────────────────────────────
  completeOnboarding: async (onboardingData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put('/auth/onboarding', onboardingData);
      localStorage.setItem('cosen_user', JSON.stringify(data.user));
      set({ user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Onboarding failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // ── Firebase Phone Verification ────────────────────────
  linkFirebasePhone: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/firebase-phone-verify', { idToken });
      
      // Update local user state
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, isPhoneVerified: true } });
      }

      set({ loading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Phone linking failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  clearError: () => set({ error: null }),


  // ── Password Reset ─────────────────────────────────────
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset link';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      // The backend logs the user in upon successful reset
      if (data.token && data.user) {
        localStorage.setItem('cosen_token', data.token);
        localStorage.setItem('cosen_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, loading: false });
      } else {
        set({ loading: false });
      }
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },
}));

export default useAuthStore;
