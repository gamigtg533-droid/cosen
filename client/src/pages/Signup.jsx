import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, CheckCircle, AlertCircle, Loader,
  User, BookOpen, GraduationCap, Code, Palette, UtensilsCrossed,
  Camera, Music, ArrowLeft, Shield, X, Eye, EyeOff, Mail, Lock, UserCircle, Trophy,
} from 'lucide-react';

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
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/BrandLogo';
import PrivacyModal from '../components/PrivacyModal';

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
  { id: 'both',   label: 'Both',            desc: 'Hire and offer services as needed',              icon: CheckCircle, color: '#FF9F43' },
];

const SKILL_OPTIONS = [
  { label: 'Coding & Dev',   icon: Code,     id: 'coding' },
  { label: 'Art & Design',   icon: Palette,  id: 'design' },
  { label: 'Food & Cooking', icon: UtensilsCrossed, id: 'food' },
  { label: 'Study Help',     icon: BookOpen, id: 'study' },
  { label: 'Photography',    icon: Camera,   id: 'photography' },
  { label: 'Playground & Esports', icon: Trophy, id: 'playground' },
  { label: 'Music & More',   icon: Music,    id: 'music' },
];

const STEPS = ['Account', 'Your Profile', 'Interests'];

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);

  /* ── Step 1 ── */
  const [form, setForm] = useState({ name: '', email: '', password: '' });

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
  const [fieldErrors,  setFieldErrors]  = useState({ name: '', email: '', password: '' });

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
      password: !form.password ? 'Password is required.'
                : form.password.length < 8 ? 'Password must be at least 8 characters.' : '',
    };
    setFieldErrors(errors);
    return Object.values(errors).some(Boolean);
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) return;
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

  /* ────────────────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-nodes" aria-hidden="true" />
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />
      <div className="auth-orb auth-orb-3" aria-hidden="true" />
      <div className="auth-top-line" aria-hidden="true" />

      {/* Brand */}
      <div className="auth-heading">
        <BrandLogo size="lg" />
        <h1 className="text-2xl font-bold mt-6 mb-1" style={{ color: '#fff' }}>
          Create your free account
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Join your campus marketplace · Step {step} of {STEPS.length}
        </p>
      </div>

      {/* Step indicator */}
      <div className="relative z-10 flex justify-center gap-0 mb-6">
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done    = step > idx;
          const current = step === idx;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: done ? '#00D4AA' : current ? '#635BFF' : 'rgba(255,255,255,0.1)',
                    color: done || current ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: current ? '0 0 0 3px rgba(99,91,255,0.35)' : 'none',
                  }}
                >
                  {done ? <CheckCircle className="h-4 w-4" /> : idx}
                </div>
                <span className="text-[10px] mt-1 font-semibold"
                  style={{ color: current ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-14 h-px mx-1 mb-4 transition-all"
                  style={{ background: done ? '#00D4AA' : 'rgba(255,255,255,0.15)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="auth-card">
        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 rounded-lg px-4 py-3 mb-5 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}
        {/* Error */}
        {displayError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {displayError}
          </div>
        )}

        {/* ══ STEP 1 — Account ══ */}
        {step === 1 && (
          <>
            <div className="flex justify-center mb-5">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLocalError('Google sign-up was cancelled or failed. Please try again.')}
              />
            </div>
            <div className="flex items-center text-xs text-gray-400 mb-5 uppercase tracking-wider">
              <div className="flex-1 border-t border-gray-600" />
              <span className="mx-4">or sign up with email</span>
              <div className="flex-1 border-t border-gray-600" />
            </div>

            <div className="flex flex-col gap-4">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Full Name</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: fieldErrors.name ? '#F87171' : 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="signup-name" type="text" name="name"
                    placeholder="Ankit Rajput"
                    className="stripe-input pl-9"
                    style={{ borderColor: fieldErrors.name ? '#F87171' : undefined, boxShadow: fieldErrors.name ? '0 0 0 3px rgba(248,113,113,0.15)' : undefined }}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur1}
                    autoFocus
                  />
                </div>
                {fieldErrors.name
                  ? <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#F87171' }}><AlertCircle className="h-3 w-3 shrink-0" /> {fieldErrors.name}</p>
                  : <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Your real name (shown on your profile)</p>
                }
              </div>

              {/* University Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">University Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: fieldErrors.email ? '#F87171' : 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="signup-email" type="email" name="email"
                    placeholder="ankit@university.ac.in"
                    className="stripe-input pl-9"
                    style={{ borderColor: fieldErrors.email ? '#F87171' : undefined, boxShadow: fieldErrors.email ? '0 0 0 3px rgba(248,113,113,0.15)' : undefined }}
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur1}
                  />
                </div>
                {fieldErrors.email
                  ? <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#F87171' }}><AlertCircle className="h-3 w-3 shrink-0" /> {fieldErrors.email}</p>
                  : <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Must end in .edu or .ac.in</p>
                }
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: fieldErrors.password ? '#F87171' : 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 8 characters"
                    className="stripe-input pl-9 pr-10"
                    style={{ borderColor: fieldErrors.password ? '#F87171' : undefined, boxShadow: fieldErrors.password ? '0 0 0 3px rgba(248,113,113,0.15)' : undefined }}
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur1}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {form.password && (() => {
                  const s = getPasswordStrength(form.password);
                  return (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all"
                            style={{ background: i <= s.score ? s.color : 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: s.color }}>
                        {s.label} password
                        {s.score <= 1 && ' — try adding numbers, capitals, or symbols'}
                      </p>
                    </div>
                  );
                })()}

                {fieldErrors.password
                  ? <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#F87171' }}><AlertCircle className="h-3 w-3 shrink-0" /> {fieldErrors.password}</p>
                  : !form.password && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Minimum 8 characters</p>
                }
              </div>

              <button id="signup-next" type="button" onClick={nextStep}
                className="btn-primary justify-center py-3 mt-1">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Already have an account?{' '}
                <Link to="/login" id="signup-to-login" className="font-semibold hover:underline" style={{ color: '#A5A1FF' }}>Sign in</Link>
              </p>
            </div>
          </>
        )}



        {/* ══ STEP 2 — Your Profile ══ */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Help classmates know who they're working with. This builds trust and speeds up hirings.
            </p>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Department / Major</label>
              <select
                className="stripe-input"
                value={profile.department}
                onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
              >
                <option value="">Select your department…</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Year of Study</label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map(y => (
                  <button key={y} type="button"
                    onClick={() => setProfile(p => ({ ...p, yearOfStudy: y }))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      borderColor: profile.yearOfStudy === y ? '#635BFF' : 'rgba(255,255,255,0.2)',
                      background:  profile.yearOfStudy === y ? '#635BFF' : 'transparent',
                      color:       profile.yearOfStudy === y ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >{y}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Gender</label>
              <div className="grid grid-cols-2 gap-2">
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
                    className="p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      borderColor: profile.gender === value ? '#635BFF' : 'rgba(255,255,255,0.15)',
                      background:  profile.gender === value ? 'rgba(99,91,255,0.18)' : 'rgba(255,255,255,0.04)',
                      color:       profile.gender === value ? '#A5A1FF' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <span className="text-base">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Short Bio <span style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span></label>
              <textarea
                rows={2}
                className="stripe-input resize-none"
                placeholder="e.g. CSE 3rd year, love solving DSA problems and building projects…"
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(1)}
                className="btn-ghost flex-1 justify-center py-3 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="button" onClick={nextStep}
                className="btn-primary flex-1 justify-center py-3">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Interests ══ */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              How do you plan to use Cosen?
            </p>

            {/* Role picker */}
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map(r => (
                <button key={r.id} type="button"
                  onClick={() => setRole(r.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: role === r.id ? r.color : 'rgba(255,255,255,0.15)',
                    background:  role === r.id ? `${r.color}18` : 'transparent',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: role === r.id ? r.color : 'rgba(255,255,255,0.08)' }}>
                    <r.icon className="h-4 w-4" style={{ color: role === r.id ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: role === r.id ? '#fff' : 'rgba(255,255,255,0.8)' }}>{r.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.desc}</div>
                  </div>
                  {role === r.id && <CheckCircle className="h-4 w-4 ml-auto shrink-0" style={{ color: r.color }} />}
                </button>
              ))}
            </div>

            {/* Skills multi-select */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Skills you have / need{' '}
                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(pick any)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_OPTIONS.map(s => {
                  const active = skills.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all"
                      style={{
                        borderColor: active ? '#635BFF' : 'rgba(255,255,255,0.15)',
                        background:  active ? 'rgba(99,91,255,0.18)' : 'rgba(255,255,255,0.04)',
                        color:       active ? '#A5A1FF' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <s.icon className="h-5 w-5" style={{ color: active ? '#A5A1FF' : 'rgba(255,255,255,0.3)' }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Privacy Policy Agreement ── */}
            <label
              className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all"
              style={{
                borderColor: agreed ? '#00D4AA' : 'rgba(255,255,255,0.15)',
                background: agreed ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  id="signup-agree"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); setLocalError(''); }}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: agreed ? '#00D4AA' : 'rgba(255,255,255,0.3)',
                    background: agreed ? '#00D4AA' : 'transparent',
                  }}
                >
                  {agreed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                </div>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                I have read and agree to Cosen's{' '}
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowPolicy(true); }}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: '#A5A1FF' }}
                >
                  Privacy Policy &amp; User Agreement
                </button>
                . I confirm I am a currently enrolled student and that the information I provide is accurate.
              </div>
            </label>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="btn-ghost flex-1 justify-center py-3 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button id="signup-submit" type="submit" disabled={loading || !agreed}
                className="btn-primary flex-1 justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!agreed ? 'Please agree to the Privacy Policy first' : ''}>
                {loading
                  ? <><Loader className="h-4 w-4 animate-spin" /> Creating…</>
                  : <>Finish &amp; Enter <ChevronRight className="h-4 w-4" /></>}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Privacy Policy Modal */}
      {showPolicy && <PrivacyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
