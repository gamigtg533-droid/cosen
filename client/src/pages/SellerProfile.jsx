import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, BookOpen, CheckCircle, MessageCircle,
  ChevronRight, Loader, AlertCircle, ExternalLink, Calendar,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import LottieLoader from '../components/LottieLoader';

/* ── Avatar placeholder ─────────────────────────────────── */
function AvatarPlaceholder({ name = '', size = 96 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white select-none shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.35,
        background: 'linear-gradient(135deg, #635BFF 0%, #00D4AA 100%)',
        boxShadow: '0 8px 24px rgba(99,91,255,0.35)',
      }}
    >
      {initials}
    </div>
  );
}

/* ── Service mini-card ───────────────────────────────────── */
function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service._id}`}
      className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 group"
      style={{ borderColor: '#E6EBF1', background: '#fff' }}
    >
      <div className="w-14 h-14 rounded-xl bg-stripe-bg flex items-center justify-center shrink-0 border border-stripe-border">
        <BookOpen className="h-6 w-6 text-stripe-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-stripe-slate text-sm truncate mb-1 group-hover:text-stripe-purple transition-colors">
          {service.title}
        </div>
        <div className="flex items-center gap-3 text-xs text-stripe-muted">
          <span className="px-2 py-0.5 rounded-full" style={{ background: '#635BFF15', color: '#635BFF' }}>
            {service.category}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {service.rating?.toFixed(1) || '—'}
          </span>
          <span className="ml-auto font-bold text-stripe-slate">
            ₹{service.price?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-stripe-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [profile,  setProfile]  = useState(null);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  /* ── If viewing own profile, redirect to /profile ──────── */
  useEffect(() => {
    if (user && (user._id === id || user.id === id)) {
      navigate('/profile', { replace: true });
    }
  }, [user, id, navigate]);

  /* ── Load seller data ───────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [profRes, svcRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/services/user/${id}`),
        ]);
        setProfile(profRes.data.user);
        setServices(svcRes.data.services || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  /* ── Contact seller (open DM) ──────────────────────────── */
  const handleContact = async () => {
    if (!user) { navigate('/login'); return; }
    setChatLoading(true);
    try {
      const { data } = await api.post('/conversations/start', { recipientId: id });
      navigate('/messages', { state: { conversationId: data.conversation.id } });
    } catch {
      navigate('/messages');
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-20">
      <LottieLoader size={120} text="Loading profile..." />
    </div>
  );

  /* ── Error ──────────────────────────────────────────────── */
  if (error || !profile) return (
    <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-20 px-4">
      <div className="stripe-card p-10 text-center max-w-sm w-full">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="font-display font-bold text-stripe-slate text-xl mb-2">Profile Not Found</h2>
        <p className="text-stripe-muted text-sm mb-6">{error || 'This user does not exist.'}</p>
        <Link to="/browse" className="btn-primary justify-center w-full py-3">Browse Services</Link>
      </div>
    </div>
  );

  const avgRating    = profile.rating?.toFixed(1) || '—';
  const totalReviews = services.reduce((s, sv) => s + (sv.reviewCount || 0), 0);
  const displayAvatar = profile.avatar?.url;
  const memberYear   = profile.createdAt ? new Date(profile.createdAt).getFullYear() : '—';

  return (
    <div className="min-h-screen bg-stripe-bg pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ══ HERO CARD ════════════════════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-sm" style={{ border: '1px solid #E6EBF1' }}>

          {/* Cover gradient or Banner Image */}
          <div className="h-36 w-full" style={{
            background: profile.bannerUrl 
              ? `url(${profile.bannerUrl}) center/cover no-repeat` 
              : 'linear-gradient(135deg, #635BFF 0%, #00D4AA 60%, #A5A1FF 100%)',
            backgroundSize: profile.bannerUrl ? 'cover' : '200% 200%',
          }} />

          <div className="bg-white px-6 sm:px-8 pt-0 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

              {/* Avatar */}
              <div className="relative -mt-12 mb-2 sm:mb-0 shrink-0">
                <div className="rounded-full p-1 bg-white inline-block shadow-lg">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <AvatarPlaceholder name={profile.name} size={96} />
                  )}
                </div>
                {profile.isEmailVerified && (
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow"
                    title="Verified user">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleContact}
                  disabled={chatLoading}
                  className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {chatLoading
                    ? <><Loader className="h-4 w-4 animate-spin" /> Opening…</>
                    : <><MessageCircle className="h-4 w-4" /> Contact Seller</>}
                </button>
              </div>
            </div>

            {/* Name + meta */}
            <h1 className="text-2xl font-bold text-stripe-slate mt-3 mb-1">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stripe-muted mt-1">
              {profile.department && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.department}
                </span>
              )}
              {profile.yearOfStudy && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> {profile.yearOfStudy}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {avgRating} · {totalReviews} reviews
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Member since {memberYear}
              </span>
              {profile.isEmailVerified && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══ STATS ROW ════════════════════════════════════ */}
        <div className="flex gap-4 flex-wrap mb-6">
          {[
            { label: 'Rating',    value: avgRating,       color: '#635BFF' },
            { label: 'Reviews',   value: totalReviews,    color: '#00D4AA' },
            { label: 'Services',  value: services.length, color: '#FF9F43' },
            { label: 'Member since', value: memberYear,   color: '#FF6B9D' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 min-w-[100px] bg-white rounded-2xl border border-stripe-border p-4 text-center">
              <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
              <div className="text-xs text-stripe-muted">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ══ LEFT COLUMN ══════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            <div className="stripe-card bg-white p-6">
              <h3 className="font-bold text-stripe-slate mb-3">About</h3>
              <p className="text-sm text-stripe-steel leading-relaxed">
                {profile.bio || <span className="text-stripe-muted italic">No bio provided.</span>}
              </p>
            </div>

            {/* Education */}
            {(profile.department || profile.yearOfStudy) && (
              <div className="stripe-card bg-white p-6">
                <h3 className="font-bold text-stripe-slate mb-4">Education</h3>
                <div className="space-y-2 text-sm">
                  {profile.department && (
                    <div className="flex justify-between">
                      <span className="text-stripe-muted">Department</span>
                      <span className="font-medium text-stripe-slate">{profile.department}</span>
                    </div>
                  )}
                  {profile.yearOfStudy && (
                    <div className="flex justify-between">
                      <span className="text-stripe-muted">Year</span>
                      <span className="font-medium text-stripe-slate">{profile.yearOfStudy}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="stripe-card bg-white p-6">
                <h3 className="font-bold text-stripe-slate mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => (
                    <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(99,91,255,0.1)', color: '#635BFF' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ═════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-5">
            <div className="stripe-card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stripe-slate">
                  Services by {profile.name?.split(' ')[0]}
                </h3>
                <span className="text-xs text-stripe-muted">{services.length} listed</span>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-xl" style={{ borderColor: '#E6EBF1' }}>
                  <BookOpen className="h-8 w-8 text-stripe-muted mx-auto mb-3 opacity-50" />
                  <p className="text-stripe-muted text-sm">No active services yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map(s => <ServiceCard key={s._id} service={s} />)}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer nav */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-stripe-muted">
          <Link to="/browse" className="hover:text-stripe-purple transition-colors flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to Browse
          </Link>
        </div>

      </div>
    </div>
  );
}
