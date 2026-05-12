import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, CheckCircle, AlertCircle, Loader,
  User, BookOpen, GraduationCap, Code, Palette, PenTool,
  Database, Music, ArrowLeft, Shield, FileText, X,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/BrandLogo';

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
  { label: 'Writing & CV',   icon: PenTool,  id: 'writing' },
  { label: 'Study Help',     icon: BookOpen, id: 'study' },
  { label: 'Data & Research',icon: Database, id: 'data' },
  { label: 'Music & More',   icon: Music,    id: 'music' },
];

const STEPS = ['Account', 'Your Profile', 'Interests'];

/* ─── Privacy Policy Modal ─────────────────────────────── */
function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(10,37,64,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl overflow-hidden"
        style={{ maxHeight: '90vh', boxShadow: '0 -8px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10" style={{ borderColor: '#E6EBF1' }}>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-stripe-purple" />
            <span className="font-bold text-stripe-slate text-base">Privacy Policy &amp; User Agreement</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stripe-bg transition-colors">
            <X className="h-4 w-4 text-stripe-muted" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 text-sm space-y-5" style={{ maxHeight: 'calc(90vh - 70px)', color: '#425466' }}>

          <p className="text-xs text-stripe-muted"><strong>Platform:</strong> Cosen – The Campus Marketplace Built for Students &nbsp;·&nbsp; Governed by Indian law (IT Act 2000, DPDPA 2023)</p>

          <div className="p-4 rounded-xl" style={{ background: '#635BFF08', border: '1px solid #635BFF20' }}>
            <p className="text-sm font-semibold text-stripe-slate">By creating an account you confirm that you have read, understood, and agree to this Privacy Policy and the terms described below.</p>
          </div>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">1. Who We Are</h3>
            <p>Cosen is a peer-to-peer student services marketplace connecting verified university students across India. Students can buy and sell services — from tutoring and coding to design and writing — within a trusted, campus-verified community. Contact: <strong>privacy@cosen.in</strong></p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">2. Information We Collect</h3>
            <p className="mb-1"><strong>You provide:</strong> Full name, university email, password (stored as a secure hash — never readable by us), profile info (department, year, photo), student ID card (for verification only), service listings, optional social links, and messages.</p>
            <p><strong>We collect automatically:</strong> Usage data, login timestamps, IP addresses, and an authentication token stored in a secure HTTP-only cookie.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">3. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-1 text-stripe-steel">
              <li>Authentication &amp; account management</li>
              <li>Student verification via email domain and ID card</li>
              <li>Processing orders, payments (via Razorpay — we never store card/UPI details), and communications</li>
              <li>Sending verification emails and platform notifications</li>
              <li>Safety, dispute resolution, and platform improvement</li>
            </ul>
            <p className="mt-1 font-semibold text-stripe-slate">We do NOT use your information for advertising and do NOT sell your data to third parties.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">4. Student ID &amp; Sensitive Data</h3>
            <p>Your student ID image is used solely to verify your enrolled student status. It is stored securely on Cloudinary, accessible only by platform administrators for verification disputes, and deleted within 30 days of account deletion. No facial recognition or automated analysis is performed on it.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">5. Data Sharing</h3>
            <p>We share data only with: <strong>Supabase</strong> (database hosting), <strong>Cloudinary</strong> (image storage), <strong>Razorpay</strong> (payment processing), <strong>Google</strong> (if you use Google login), and our email provider. We never sell your data, share your student ID with other users, or transfer data outside India-compliant services.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">6. Cookies &amp; Sessions</h3>
            <p>We use a single essential cookie — a JWT stored in an HTTP-only cookie (protected against XSS). It contains your user ID and session info, not your password or payment details. It expires on sign-out or inactivity.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">7. Data Retention</h3>
            <ul className="list-disc list-inside space-y-1 text-stripe-steel">
              <li>Active accounts: retained while account is active</li>
              <li>Deleted accounts: PII removed within 30 days</li>
              <li>Transaction records: retained 7 years (Indian tax law)</li>
              <li>Chat history: retained 2 years for dispute support</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">8. Your Rights (DPDPA 2023)</h3>
            <p>You have the right to access, correct, erase, and withdraw consent for your personal data. To exercise any right, email <strong>privacy@cosen.in</strong> with subject "Data Rights Request."</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">9. Security</h3>
            <p>We use bcryptjs password hashing, HTTP-only JWT cookies, Supabase Row Level Security, Razorpay PCI DSS compliance, Cloudinary secure uploads, and HTTPS/TLS for all data in transit.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">10. Age Restrictions</h3>
            <p>Cosen is exclusively for enrolled university/college students. We do not knowingly collect data from individuals under 18. Accounts found to belong to minors will be suspended and data deleted.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">11. Policy Updates</h3>
            <p>We will notify you by email and in-app notice at least 7 days before significant changes. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h3 className="font-bold text-stripe-slate mb-1">12. Contact</h3>
            <p><strong>Cosen Privacy Team</strong><br />Email: privacy@cosen.in &nbsp;·&nbsp; Platform: www.cosen.in<br />We respond to all privacy queries within 15 business days.</p>
          </section>

          <p className="text-xs text-stripe-muted pt-2 border-t" style={{ borderColor: '#E6EBF1' }}>
            Governed by the Information Technology Act 2000, IT (SPDI) Rules 2011, and the Digital Personal Data Protection Act 2023.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t" style={{ borderColor: '#E6EBF1' }}>
          <button onClick={onClose} className="w-full btn-primary justify-center py-3">
            <CheckCircle className="h-4 w-4" /> Got it, close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);

  /* ── Step 1 ── */
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  /* ── Step 2 ── */
  const [profile, setProfile] = useState({ department: '', yearOfStudy: '', bio: '' });

  /* ── Step 3 ── */
  const [role, setRole]     = useState('');
  const [skills, setSkills] = useState([]);

  const [localError, setLocalError] = useState('');
  const [success,    setSuccess]    = useState('');
  const [agreed,     setAgreed]     = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleChange = (e) => {
    clearError();
    setLocalError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const toggleSkill = (id) =>
    setSkills(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  /* ── Step validation ── */
  const validateStep1 = () => {
    if (!form.name.trim())     return 'Full name is required.';
    if (!form.email.trim())    return 'Email is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const nextStep = () => {
    const err = step === 1 ? validateStep1() : '';
    if (err) { setLocalError(err); return; }
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
      role:        role || 'both',
      interests:   skills,
    };
    const result = await register(payload);
    if (result.success) {
      setSuccess(result.message || 'Account created! Redirecting…');
      setTimeout(() => navigate('/browse'), 1500);
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
                onError={() => setLocalError('Google Registration Failed')}
              />
            </div>
            <div className="flex items-center text-xs text-gray-400 mb-5 uppercase tracking-wider">
              <div className="flex-1 border-t border-gray-600" />
              <span className="mx-4">or sign up with email</span>
              <div className="flex-1 border-t border-gray-600" />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Full Name</label>
                <input id="signup-name" type="text" name="name" placeholder="Ankit Rajput"
                  className="stripe-input" value={form.name} onChange={handleChange} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">University Email</label>
                <input id="signup-email" type="email" name="email" placeholder="ankit@university.ac.in"
                  className="stripe-input" value={form.email} onChange={handleChange} />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Must be a .edu or .ac.in address</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Password</label>
                <input id="signup-password" type="password" name="password" placeholder="Min. 8 characters"
                  className="stripe-input" value={form.password} onChange={handleChange} />
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
              <label className="block text-sm font-semibold mb-1.5">Short Bio <span style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span></label>
              <textarea
                rows={3}
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
