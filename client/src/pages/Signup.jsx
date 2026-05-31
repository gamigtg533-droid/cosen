import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, CheckCircle, AlertCircle, Loader,
  User, BookOpen, GraduationCap, Code, Palette, UtensilsCrossed,
  Camera, Music, ArrowLeft, Shield, Eye, EyeOff, Mail, Lock, UserCircle, Trophy, Phone,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/BrandLogo';
import PrivacyModal from '../components/PrivacyModal';

const EDU_REGEX = /^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/i;

const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#EF4444' };
  if (score <= 3) return { score, label: 'Medium', color: '#F59E0B' };
  return               { score, label: 'Strong', color: '#10B981' };
};

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering',
  'Business Administration', 'Commerce', 'Fine Arts', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Psychology', 'Law', 'Medicine',
  'Architecture', 'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

const ROLES = [
  { id: 'buyer',  label: 'I want to hire', desc: 'Find campus talent for projects & assignments', icon: User, color: '#00D4AA' },
  { id: 'seller', label: 'I want to earn',  desc: 'Offer my skills and services to classmates',    icon: GraduationCap, color: '#635BFF' },
  { id: 'both',   label: 'Both',            desc: 'Hire and offer services as needed',              icon: CheckCircle, color: '#F59E0B' },
];

const SKILL_OPTIONS = [
  { label: 'Coding & Dev',   icon: Code,     id: 'coding' },
  { label: 'Art & Design',   icon: Palette,  id: 'design' },
  { label: 'Food & Cooking', icon: UtensilsCrossed, id: 'food' },
  { label: 'Study Help',     icon: BookOpen, id: 'study' },
  { label: 'Photography',    icon: Camera,   id: 'photography' },
  { label: 'Playground',     icon: Trophy,   id: 'playground' },
  { label: 'Music & More',   icon: Music,    id: 'music' },
];

const STEPS = ['Account', 'Your Profile', 'Interests'];

export default function Signup() {
  const navigate = useNavigate();
  const { register, checkUser, loading, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);

  /* ── Step 1 ── */
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  /* ── Step 2 ── */
  const [profile, setProfile] = useState({ department: '', yearOfStudy: '', bio: '', gender: '' });

  /* ── Step 3 ── */
  const [role, setRole]     = useState('');
  const [skills, setSkills] = useState([]);

  const [localError,   setLocalError]   = useState('');
  const [success,      setSuccess]      = useState('');
  const [agreed,       setAgreed]       = useState(false);
  const [showPolicy,   setShowPolicy]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState({ name: '', email: '', phone: '', password: '' });

  const handleChange = (e) => {
    clearError();
    setLocalError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors(f => ({ ...f, [e.target.name]: '' }));
    }
  };

  const handleBlur1 = (e) => {
    const { name, value } = e.target;
    let err = '';
    if (name === 'name') {
      if (!value.trim()) err = 'Full name is required.';
      else if (value.trim().length < 2) err = 'Name must be at least 2 characters.';
    }
    if (name === 'email') {
      if (!value.trim()) err = 'Email is required.';
      else if (!value.includes('@')) err = 'Enter a valid email address.';
      else if (!EDU_REGEX.test(value)) err = 'Must be a university email ending in .edu or .ac.in';
    }
    if (name === 'phone') {
      if (!value.trim()) err = 'Phone number is required.';
      else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) err = 'Enter a valid 10-digit phone number.';
    }
    if (name === 'password') {
      if (!value) err = 'Password is required.';
      else if (value.length < 8) err = 'Password must be at least 8 characters.';
    }
    setFieldErrors(f => ({ ...f, [name]: err }));
  };

  const toggleSkill = (id) =>
    setSkills(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  /* ── Step 1 validation ── */
  const validateStep1 = () => {
    const errors = {
      name:     !form.name.trim() ? 'Full name is required.'
                : form.name.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
      email:    !form.email.trim() ? 'Email is required.'
                : !EDU_REGEX.test(form.email) ? 'Must be a university email (.edu or .ac.in)' : '',
      phone:    !form.phone.trim() ? 'Phone number is required.'
                : !/^\d{10}$/.test(form.phone.replace(/\D/g, '')) ? 'Enter a valid 10-digit phone number.' : '',
      password: !form.password ? 'Password is required.'
                : form.password.length < 8 ? 'Password must be at least 8 characters.' : '',
    };
    setFieldErrors(errors);
    return Object.values(errors).some(Boolean);
  };

  const nextStep = async () => {
    if (step === 1) {
      if (validateStep1()) return;
      
      const res = await checkUser(form.email, null);
      if (res.success) {
        if (res.emailTaken) {
          setFieldErrors(f => ({ ...f, email: 'An account with this email already exists.' }));
          return;
        }
      }
    }

    if (step === 2) {
      if (!profile.department) {
        setLocalError('Please select your department.');
        return;
      }
      if (!profile.yearOfStudy) {
        setLocalError('Please select your year of study.');
        return;
      }
      if (!profile.gender) {
        setLocalError('Please select your gender.');
        return;
      }
    }
    setLocalError('');
    setStep(s => s + 1);
  };

  /* ── Final submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setLocalError('Please read and agree to the Privacy Policy before creating your account.');
      return;
    }
    const payload = {
      ...form,
      department:  profile.department,
      yearOfStudy: profile.yearOfStudy,
      bio:         profile.bio,
      gender:      profile.gender || 'Prefer not to say',
      role:        role || 'both',
      interests:   skills,
    };
    const result = await register(payload);
    if (result.success) {
      setSuccess(result.message || 'Account created! Redirecting…');
      setTimeout(() => navigate('/browse'), 1500);
    } else {
      const raw = result.message || '';
      if (raw.toLowerCase().includes('already exists')) {
        setLocalError('An account with this email already exists. Try signing in instead.');
      } else if (raw.toLowerCase().includes('university') || raw.toLowerCase().includes('ac.in')) {
        setLocalError('Only university emails (.edu or .ac.in) are accepted on Cosen.');
      } else if (raw.toLowerCase().includes('server error')) {
        setLocalError('Something went wrong on our end. Please try again in a moment.');
      } else {
        setLocalError(raw || 'Registration failed. Please try again.');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await useAuthStore.getState().loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      setSuccess('Google signup successful! Redirecting…');
      setTimeout(() => navigate('/browse'), 1500);
    } else {
      setLocalError('Google signup failed. Please try email registration.');
    }
  };

  const displayError = localError || error;

  /* ── Field style helper ── */
  const inputStyle = (field) => ({
    borderColor: fieldErrors[field] ? '#F87171' : '#E2E8F0',
    boxShadow:   fieldErrors[field] ? '0 0 0 3px rgba(248,113,113,0.15)' : undefined,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      
      {/* Top Navigation Bar */}
      <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <BrandLogo size="lg" />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingBottom: '3rem' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.875rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Create your free account
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
              Join your campus marketplace · Step {step} of {STEPS.length}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const done    = step > idx;
              const current = step === idx;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: done ? '#0F172A' : current ? '#635BFF' : '#F1F5F9',
                        color: done || current ? '#fff' : '#94A3B8',
                        boxShadow: current ? '0 0 0 4px rgba(99,91,255,0.15)' : 'none',
                      }}
                    >
                      {done ? <CheckCircle style={{ width: 18, height: 18 }} /> : idx}
                    </div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem', fontWeight: 700, color: current ? '#0F172A' : '#94A3B8' }}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 48, height: 2, margin: '0 12px', marginBottom: '20px', transition: 'all 0.3s', background: done ? '#0F172A' : '#F1F5F9' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
            
            {/* Success */}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} /> {success}
              </div>
            )}
            
            {/* Error */}
            {displayError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} /> {displayError}
              </div>
            )}

            {/* ══ STEP 1 — Account ══ */}
            {step === 1 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setLocalError('Google sign-up was cancelled or failed. Please try again.')}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                  <span style={{ margin: '0 1rem' }}>or sign up with email</span>
                  <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="signup-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserCircle style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: fieldErrors.name ? '#EF4444' : '#94A3B8', pointerEvents: 'none' }} />
                      <input
                        id="signup-name" type="text" name="name"
                        placeholder="Ankit Rajput"
                        className="stripe-input"
                        style={{ ...inputStyle('name'), paddingLeft: '2.75rem', background: '#FAFBFF', fontSize: '0.95rem' }}
                        value={form.name}
                        onChange={handleChange}
                        onBlur={handleBlur1}
                        autoFocus
                      />
                    </div>
                    {fieldErrors.name
                      ? <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 500 }}><AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {fieldErrors.name}</p>
                      : <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94A3B8' }}>Your real name (shown on your profile)</p>
                    }
                  </div>

                  {/* University Email */}
                  <div>
                    <label htmlFor="signup-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>University Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: fieldErrors.email ? '#EF4444' : '#94A3B8', pointerEvents: 'none' }} />
                      <input
                        id="signup-email" type="email" name="email"
                        placeholder="ankit@university.ac.in"
                        className="stripe-input"
                        style={{ ...inputStyle('email'), paddingLeft: '2.75rem', background: '#FAFBFF', fontSize: '0.95rem' }}
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur1}
                      />
                    </div>
                    {fieldErrors.email
                      ? <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 500 }}><AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {fieldErrors.email}</p>
                      : <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94A3B8' }}>Must end in .edu or .ac.in</p>
                    }
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="signup-phone" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: fieldErrors.phone ? '#EF4444' : '#94A3B8', pointerEvents: 'none' }} />
                      <input
                        id="signup-phone" type="tel" name="phone"
                        placeholder="e.g. 9876543210"
                        className="stripe-input"
                        style={{ ...inputStyle('phone'), paddingLeft: '2.75rem', background: '#FAFBFF', fontSize: '0.95rem' }}
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur1}
                      />
                    </div>
                    {fieldErrors.phone
                      ? <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 500 }}><AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {fieldErrors.phone}</p>
                      : <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94A3B8' }}>Please add your valid phone number because our team is verifying it later.</p>
                    }
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="signup-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: fieldErrors.password ? '#EF4444' : '#94A3B8', pointerEvents: 'none' }} />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Min. 8 characters"
                        className="stripe-input"
                        style={{ ...inputStyle('password'), paddingLeft: '2.75rem', paddingRight: '2.75rem', background: '#FAFBFF', fontSize: '0.95rem' }}
                        value={form.password}
                        onChange={handleChange}
                        onBlur={handleBlur1}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(s => !s)}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                      </button>
                    </div>

                    {/* Password strength bar */}
                    {form.password && (() => {
                      const s = getPasswordStrength(form.password);
                      return (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                            {[1,2,3,4,5].map(i => (
                              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, transition: 'all 0.3s', background: i <= s.score ? s.color : '#F1F5F9' }} />
                            ))}
                          </div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, margin: 0 }}>
                            {s.label} password
                            {s.score <= 1 && <span style={{ color: '#94A3B8', fontWeight: 400 }}> — try adding numbers, capitals, or symbols</span>}
                          </p>
                        </div>
                      );
                    })()}

                    {fieldErrors.password
                      ? <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 500 }}><AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {fieldErrors.password}</p>
                      : !form.password && <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94A3B8' }}>Minimum 8 characters</p>
                    }
                  </div>

                  <button id="signup-next" type="button" onClick={nextStep}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      background: '#0F172A', color: '#fff', fontWeight: 700, fontSize: '1rem',
                      padding: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s', marginTop: '0.5rem',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Continue <ChevronRight style={{ width: 18, height: 18 }} />
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
                    Already have an account?{' '}
                    <Link to="/login" id="signup-to-login" style={{ fontWeight: 700, color: '#0F172A', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >Sign in</Link>
                  </p>
                </div>
              </>
            )}


            {/* ══ STEP 2 — Your Profile ══ */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Why we ask:</span> This helps classmates know who they're working with, building trust and speeding up transactions.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>Department / Major</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="stripe-input"
                      value={profile.department}
                      onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                      style={{ background: '#fff', cursor: 'pointer', fontSize: '0.95rem', padding: '0.875rem 1rem', appearance: 'none' }}
                    >
                      <option value="" disabled>Select your department…</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronRight style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', width: 16, height: 16, color: '#94A3B8', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>Year of Study</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {YEARS.map(y => (
                      <button key={y} type="button"
                        onClick={() => setProfile(p => ({ ...p, yearOfStudy: y }))}
                        style={{
                          padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          border: profile.yearOfStudy === y ? '1px solid #0F172A' : '1px solid #E2E8F0',
                          background: profile.yearOfStudy === y ? '#0F172A' : '#fff',
                          color: profile.yearOfStudy === y ? '#fff' : '#475569',
                        }}
                        onMouseEnter={e => { if (profile.yearOfStudy !== y) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                        onMouseLeave={e => { if (profile.yearOfStudy !== y) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
                      >{y}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>Gender</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { value: 'Male', emoji: '👨', label: 'Male' },
                      { value: 'Female', emoji: '👩', label: 'Female' },
                      { value: 'Other', emoji: '🌈', label: 'Other' },
                      { value: 'Prefer not to say', emoji: '🔒', label: 'Prefer not to say' },
                    ].map(({ value, emoji, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setProfile(p => ({ ...p, gender: value })); setLocalError(''); }}
                        style={{
                          padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: '0.9rem', fontWeight: 600,
                          border: profile.gender === value ? '2px solid #0F172A' : '2px solid transparent',
                          background: profile.gender === value ? '#F8FAFC' : '#F1F5F9',
                          color: profile.gender === value ? '#0F172A' : '#475569',
                        }}
                        onMouseEnter={e => { if (profile.gender !== value) e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={e => { if (profile.gender !== value) e.currentTarget.style.background = '#F1F5F9'; }}
                      >
                        <span style={{ fontSize: '1.2rem', filter: profile.gender !== value ? 'grayscale(100%) opacity(70%)' : 'none' }}>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                    Short Bio <span style={{ color: '#94A3B8', fontWeight: 500 }}>(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    className="stripe-input resize-none"
                    placeholder="e.g. CSE 3rd year, love solving DSA problems and building web projects…"
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    style={{ background: '#fff', fontSize: '0.95rem', padding: '0.875rem 1rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex: '0 0 auto', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '0.75rem', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                  </button>
                  <button type="button" onClick={nextStep}
                    style={{ flex: 1, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#0F172A', border: 'none', borderRadius: '0.75rem', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Continue <ChevronRight style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Interests ══ */}
            {step === 3 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Role picker */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>How do you plan to use Cosen?</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {ROLES.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => setRole(r.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', borderRadius: '1rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: role === r.id ? `2px solid ${r.color}` : '2px solid transparent',
                          background: role === r.id ? `${r.color}0A` : '#F1F5F9',
                        }}
                        onMouseEnter={e => { if (role !== r.id) e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={e => { if (role !== r.id) e.currentTarget.style.background = '#F1F5F9'; }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: role === r.id ? r.color : '#fff', boxShadow: role === r.id ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                          <r.icon style={{ width: 20, height: 20, color: role === r.id ? '#fff' : '#64748B' }} />
                        </div>
                        <div style={{ flex: 1, paddingTop: '0.1rem' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: role === r.id ? '#0F172A' : '#334155' }}>{r.label}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>{r.desc}</div>
                        </div>
                        {role === r.id && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                            <CheckCircle style={{ width: 12, height: 12, color: '#fff' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills multi-select */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem 0' }}>
                    What are your interests? <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.9rem' }}>(select any)</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                    {SKILL_OPTIONS.map(s => {
                      const active = skills.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: active ? '2px solid #0F172A' : '2px solid transparent',
                            background: active ? '#F8FAFC' : '#F1F5F9',
                            color: active ? '#0F172A' : '#64748B',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#E2E8F0'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#F1F5F9'; }}
                        >
                          <s.icon style={{ width: 20, height: 20, color: active ? '#0F172A' : '#94A3B8' }} />
                          <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Privacy Policy Agreement ── */}
                <label
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '1rem', transition: 'all 0.2s',
                    border: agreed ? '1px solid #10B981' : '1px solid #E2E8F0',
                    background: agreed ? '#ECFDF5' : '#FAFBFF',
                  }}
                >
                  <div style={{ position: 'relative', marginTop: 2, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      id="signup-agree"
                      checked={agreed}
                      onChange={e => { setAgreed(e.target.checked); setLocalError(''); }}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        border: agreed ? '2px solid #10B981' : '2px solid #CBD5E1',
                        background: agreed ? '#10B981' : '#fff',
                      }}
                    >
                      {agreed && <CheckCircle style={{ width: 14, height: 14, color: '#fff' }} />}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#475569' }}>
                    I have read and agree to Cosen's{' '}
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setShowPolicy(true); }}
                      style={{ fontWeight: 700, color: '#0F172A', textDecoration: 'underline', textUnderlineOffset: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      Privacy Policy &amp; User Agreement
                    </button>
                    . I confirm I am a currently enrolled student and that the information I provide is accurate.
                  </div>
                </label>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setStep(2)}
                    style={{ flex: '0 0 auto', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '0.75rem', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#475569'; }}
                  >
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                  </button>
                  <button id="signup-submit" type="submit" disabled={loading || !agreed}
                    style={{
                      flex: 1, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#0F172A', border: 'none', borderRadius: '0.75rem', color: '#fff', fontWeight: 700, fontSize: '1rem',
                      cursor: (loading || !agreed) ? 'not-allowed' : 'pointer', opacity: (loading || !agreed) ? 0.6 : 1, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if(!loading && agreed) { e.currentTarget.style.background = '#334155'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { if(!loading && agreed) { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    title={!agreed ? 'Please agree to the Privacy Policy first' : ''}
                  >
                    {loading
                      ? <><Loader style={{ width: 18, height: 18 }} className="animate-spin" /> Creating account…</>
                      : <>Finish &amp; Enter <ChevronRight style={{ width: 18, height: 18 }} /></>}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </main>

      {/* Privacy Policy Modal */}
      {showPolicy && <PrivacyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
