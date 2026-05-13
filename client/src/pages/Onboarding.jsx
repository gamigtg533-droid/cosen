import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import {
  ChevronRight, ChevronLeft, CheckCircle, Loader,
  User, Shield, Share2, FileText, Camera, Phone, KeyRound, AlertCircle,
} from 'lucide-react';
import PrivacyModal from '../components/PrivacyModal';

const STEPS = [
  { label: 'Basic Info',   icon: User },
  { label: 'Verification', icon: Shield },
  { label: 'Socials',      icon: Share2 },
  { label: 'Agreement',    icon: FileText },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const {
    user, completeOnboarding, sendPhoneOtp, verifyPhoneOtp,
    loading, error: authError, clearError,
  } = useAuthStore();

  const [step, setStep]           = useState(1);
  const [localError, setLocalError] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);

  /* ── Image uploads ── */
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ── Phone OTP state ── */
  const [phone, setPhone]               = useState('');
  const [phoneError, setPhoneError]     = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const [otp, setOtp]                   = useState('');
  const [otpError, setOtpError]         = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp]     = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── Main form ── */
  const [form, setForm] = useState({
    dob:                      user?.dob || '',
    department:               user?.department || '',
    yearOfStudy:              user?.yearOfStudy || '',
    avatarUrl:                user?.avatar?.url || '',
    instagramUrl:             user?.instagramUrl || '',
    facebookUrl:              user?.facebookUrl || '',
    youtubeUrl:               user?.youtubeUrl || '',
    xUrl:                     user?.xUrl || '',
    platformAgreementAccepted: user?.platformAgreementAccepted || false,
  });

  const isSeller = user?.role === 'seller' || user?.role === 'both';

  /* ── Resend countdown ── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const nextStep = () => {
    setLocalError('');
    clearError();
    if (step === 1 && !form.dob) return setLocalError('Date of Birth is required.');
    if (step === 2) {
      if (!phoneVerified) return setLocalError('Please verify your phone number to continue.');
      if (isSeller && !form.avatarUrl) return setLocalError('A profile photo is required for sellers.');
    }
    if (step === 4 && !form.platformAgreementAccepted) return setLocalError('You must accept the platform agreement.');
    setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => { setLocalError(''); setStep(s => Math.max(s - 1, 1)); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ── Avatar upload ── */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    setLocalError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, avatarUrl: res.data.url }));
    } catch {
      setLocalError('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };



  /* ── Send OTP ── */
  const handleSendOtp = async () => {
    setPhoneError('');
    const cleaned = phone.replace(/\s/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number (starting with 6–9).');
      return;
    }
    setSendingOtp(true);

    try {
      const e164 = `+91${cleaned}`;
      const res = await sendPhoneOtp(e164);
      if (res.success) {
        setOtpSent(true);
        setOtpError('');
        setResendCooldown(30);
      } else {
        setPhoneError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setPhoneError('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otp || otp.length < 6) {
      setOtpError('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setVerifyingOtp(true);
    
    try {
      const res = await verifyPhoneOtp(otp);
      
      if (res.success) {
        setPhoneVerified(true);
        setOtpError('');
        setLocalError('');
      } else {
        setOtpError(res.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.platformAgreementAccepted) { setLocalError('You must accept the platform agreement.'); return; }
    const result = await completeOnboarding(form);
    if (result.success) navigate('/dashboard');
  };

  const displayError = localError || authError;

  const Label = ({ children, optional }) => (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#fff' }}>
      {children}
      {optional && <span className="ml-1 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>(optional)</span>}
    </label>
  );

  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-nodes" aria-hidden="true" />
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />
      <div className="auth-top-line" aria-hidden="true" />

      <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-12 z-10 relative">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#fff' }}>Complete Your Profile</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
            Only takes 2 minutes — helps buyers trust you instantly
          </p>
        </div>

        {/* ── Step progress ── */}
        <div className="flex justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const idx  = i + 1;
            const done = step > idx;
            const cur  = step === idx;
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: done ? '#00D4AA' : cur ? '#635BFF' : 'rgba(255,255,255,0.1)',
                      boxShadow: cur ? '0 0 0 3px rgba(99,91,255,0.4)' : 'none',
                    }}
                  >
                    {done
                      ? <CheckCircle className="h-4 w-4 text-white" />
                      : <Icon className="h-4 w-4" style={{ color: cur ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                    }
                  </div>
                  <span className="text-[10px] mt-1 font-semibold"
                    style={{ color: cur ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-px mx-1 mb-4"
                    style={{ background: step > idx ? '#00D4AA' : 'rgba(255,255,255,0.15)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Card ── */}
        <div className="auth-card">

          {/* Error banner */}
          {displayError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {displayError}
            </div>
          )}

          {/* Step title */}
          <div className="mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A5A1FF' }}>
              Step {step} of 4
            </p>
            <h2 className="text-xl font-bold" style={{ color: '#fff' }}>
              {step === 1 && 'Basic Details'}
              {step === 2 && 'Phone Verification'}
              {step === 3 && 'Social Profiles'}
              {step === 4 && 'Platform Agreement'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {step === 1 && 'Tell us about yourself so services are tailored to you.'}
              {step === 2 && 'Verify your phone number to secure your account.'}
              {step === 3 && 'Optional links that help buyers trust your identity.'}
              {step === 4 && 'Review and accept our community guidelines.'}
            </p>
          </div>

          {/* ── STEP 1 — Basic Info ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <Label>Date of Birth *</Label>
                <input type="date" name="dob" className="stripe-input" value={form.dob} onChange={handleChange} />
              </div>
              <div>
                <Label optional>Department / Major</Label>
                <input type="text" name="department" className="stripe-input"
                  placeholder="e.g. Computer Science" value={form.department} onChange={handleChange} />
              </div>
              <div>
                <Label optional>Year of Study</Label>
                <select name="yearOfStudy" className="stripe-input" value={form.yearOfStudy} onChange={handleChange}>
                  <option value="">Select year…</option>
                  {['1st Year','2nd Year','3rd Year','4th Year','Postgraduate'].map(y => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Phone Verification + Profile Photo ── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">

              {/* Phone number */}
              <div>
                <Label>Mobile Number *</Label>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  We'll send a 6-digit OTP to verify your number. Indian numbers only (+91).
                </p>

                {phoneVerified ? (
                  /* ✅ Verified state */
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.4)' }}>
                    <CheckCircle className="h-5 w-5 shrink-0" style={{ color: '#00D4AA' }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#00D4AA' }}>Phone Verified ✓</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>+91 {phone.replace(/^\+91/, '')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Phone input row */}
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 rounded-lg text-sm font-semibold shrink-0"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                        <Phone className="h-4 w-4 mr-1.5" /> +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        className="stripe-input flex-1"
                        style={{ borderColor: phoneError ? '#F87171' : undefined }}
                        value={phone}
                        onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
                        disabled={otpSent && !phoneVerified}
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || (resendCooldown > 0 && otpSent)}
                        className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingOtp
                          ? <Loader className="h-4 w-4 animate-spin" />
                          : otpSent
                            ? resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'
                            : 'Send OTP'
                        }
                      </button>
                    </div>
                    {phoneError && (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#F87171' }}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> {phoneError}
                      </p>
                    )}

                    {/* OTP input — shows after OTP is sent */}
                    {otpSent && (
                      <div className="flex flex-col gap-2 mt-1">
                        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Enter the 6-digit OTP sent to your phone:
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                              style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="• • • • • •"
                              className="stripe-input pl-9 tracking-[0.35em] font-bold text-center"
                              style={{ borderColor: otpError ? '#F87171' : undefined, letterSpacing: '0.35em' }}
                              value={otp}
                              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otp.length < 6}
                            className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingOtp ? <Loader className="h-4 w-4 animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                        {otpError && (
                          <p className="text-xs flex items-center gap-1" style={{ color: '#F87171' }}>
                            <AlertCircle className="h-3 w-3 shrink-0" /> {otpError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Photo */}
              <div>
                <Label optional={!isSeller}>
                  Profile Photo {isSeller && <span className="text-xs font-normal ml-1" style={{ color: '#FF9F43' }}>required for sellers</span>}
                </Label>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {isSeller
                    ? 'A clear photo builds buyer trust and is required to post services.'
                    : 'Optional — you can set this later from your dashboard.'}
                </p>
                <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all hover:border-stripe-purple"
                  style={{ borderColor: form.avatarUrl ? '#00D4AA' : 'rgba(255,255,255,0.2)' }}>
                  {uploadingAvatar
                    ? <Loader className="h-8 w-8 animate-spin" style={{ color: '#A5A1FF' }} />
                    : form.avatarUrl
                    ? <img src={form.avatarUrl} alt="avatar"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[#00D4AA]" />
                    : <Camera className="h-8 w-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  }
                  <span className="text-sm font-semibold" style={{ color: form.avatarUrl ? '#00D4AA' : 'rgba(255,255,255,0.6)' }}>
                    {uploadingAvatar ? 'Uploading…' : form.avatarUrl ? 'Photo uploaded ✓ — click to replace' : 'Click to upload a profile photo'}
                  </span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Socials ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                All fields are optional. Adding social links builds buyer trust and helps you get more orders.
              </p>
              {[
                { name: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/username' },
                { name: 'facebookUrl',  label: 'Facebook',  placeholder: 'https://facebook.com/username' },
                { name: 'youtubeUrl',   label: 'YouTube',   placeholder: 'https://youtube.com/@username' },
                { name: 'xUrl',         label: 'X (Twitter)', placeholder: 'https://x.com/username' },
              ].map(field => (
                <div key={field.name}>
                  <Label optional>{field.label}</Label>
                  <input type="url" name={field.name} className="stripe-input"
                    placeholder={field.placeholder} value={form[field.name]} onChange={handleChange} />
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 4 — Agreement ── */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl p-4 text-sm overflow-y-auto max-h-44 space-y-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
                <p><strong style={{ color: '#fff' }}>1. Code of Conduct:</strong> Users must treat everyone with respect. Harassment, abuse, or discrimination will result in immediate account suspension.</p>
                <p><strong style={{ color: '#fff' }}>2. Real Identity:</strong> You confirm that your phone number belongs to you and that you are currently enrolled as a student.</p>
                <p><strong style={{ color: '#fff' }}>3. Transactions:</strong> All payments must go through our Razorpay Escrow system. Off-platform transactions are a bannable offence.</p>
                <p><strong style={{ color: '#fff' }}>4. Content:</strong> Services must be legal and campus-appropriate. Any illegal or plagiarised work will be removed immediately.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" name="platformAgreementAccepted"
                  checked={form.platformAgreementAccepted} onChange={handleChange}
                  className="mt-0.5 w-5 h-5 rounded accent-[#635BFF] cursor-pointer" />
                <span className="text-sm font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  I have read and accept the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPolicy(true); }}
                    className="font-semibold hover:underline"
                    style={{ color: '#A5A1FF' }}
                  >
                    Platform Agreements &amp; Terms of Service
                  </button>
                </span>
              </label>
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div className="flex justify-between mt-8 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {step > 1 ? (
              <button type="button" onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.07)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button type="button" onClick={nextStep} className="btn-primary py-2 px-6">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading
                  ? <><Loader className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><CheckCircle className="h-4 w-4" /> Complete Profile</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPolicy && <PrivacyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
