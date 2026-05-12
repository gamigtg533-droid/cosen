import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Code, Palette, PenTool, Database, Music,
  Plus, X, ChevronRight, Loader, CheckCircle, AlertCircle,
  Briefcase, Clock, DollarSign, Tag, FileText, Zap, LogIn, Camera, ImageIcon
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

const CATEGORIES = [
  { value: 'Study Helper',    label: 'Study Helper',    icon: BookOpen, color: '#00D4AA' },
  { value: 'Tech & Coding',  label: 'Tech & Coding',   icon: Code,     color: '#635BFF' },
  { value: 'Art & Design',   label: 'Art & Design',    icon: Palette,  color: '#FF6B9D' },
  { value: 'Writing & CV',   label: 'Writing & CV',    icon: PenTool,  color: '#4FC3F7' },
  { value: 'Research & Data',label: 'Research & Data', icon: Database, color: '#FF9F43' },
  { value: 'Other Talents',  label: 'Other Talents',   icon: Music,    color: '#A855F7' },
];

const DELIVERY_OPTIONS = [1,2,3,5,7,10,14,21,30];

const catBg = {
  'Study Helper':    'linear-gradient(135deg,#E8FFF8,#C8FFF0)',
  'Tech & Coding':   'linear-gradient(135deg,#EEF0FF,#DDE0FF)',
  'Art & Design':    'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Writing & CV':    'linear-gradient(135deg,#F0F8FF,#DDEEFF)',
  'Research & Data': 'linear-gradient(135deg,#FFF8EE,#FFE8CC)',
  'Other Talents':   'linear-gradient(135deg,#F8F0FF,#EEDDFF)',
};

export default function PostService() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); // null if creating, service id if editing

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    deliveryDays: '',
    tags: [],
    coverImageUrl: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  // ── Load existing service for editing ──────────────
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(`/services/${editId}`);
        const s = data.service;
        setForm({
          title: s.title || '',
          description: s.description || '',
          category: s.category || '',
          price: s.price?.toString() || '',
          deliveryDays: s.deliveryDays?.toString() || '',
          tags: s.tags || [],
          coverImageUrl: s.images?.[0] || s.coverImageUrl || '',
        });
      } catch (err) {
        setApiError('Could not load service. Please go back and try again.');
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [editId]);

  // ── Auth Guard ─────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-16 px-4">
        <div className="stripe-card p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-stripe-purple/10 flex items-center justify-center mx-auto mb-5">
            <LogIn className="h-7 w-7 text-stripe-purple" />
          </div>
          <h2 className="font-display font-bold text-stripe-slate text-xl mb-2">Sign in to post a service</h2>
          <p className="text-stripe-muted text-sm mb-6">Create an account or log in to start offering your skills to fellow students.</p>
          <Link to="/login" className="btn-primary justify-center w-full py-3">
            Sign in <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/signup" className="block mt-3 text-sm text-stripe-purple font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  // ── Onboarding Guard ───────────────────────────────
  if (!user.isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-16 px-4">
        <div className="stripe-card p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-stripe-purple/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-7 w-7 text-stripe-purple" />
          </div>
          <h2 className="font-display font-bold text-stripe-slate text-xl mb-2">Completion Required</h2>
          <p className="text-stripe-muted text-sm mb-6">You must complete your profile by providing your ID card and details to sell services and earn the verified badge.</p>
          <Link to="/onboarding" className="btn-primary justify-center w-full py-3">
            Complete Profile <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="block mt-4 text-sm text-stripe-purple font-semibold hover:underline">
            Go to Exploring
          </Link>
        </div>
      </div>
    );
  }

  // ── Validation ───────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 10)
      e.title = 'Title must be at least 10 characters.';
    if (!form.description.trim() || form.description.trim().length < 30)
      e.description = 'Description must be at least 30 characters.';
    if (!form.category)
      e.category = 'Please select a category.';
    if (!form.price || isNaN(form.price) || Number(form.price) < 50)
      e.price = 'Price must be at least ₹50.';
    if (!form.deliveryDays)
      e.deliveryDays = 'Please select a delivery time.';
    return e;
  };

  // ── Tag helpers ──────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  };

  // ── Submit (create or update) ──────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        deliveryDays: Number(form.deliveryDays),
        tags: form.tags,
        coverImageUrl: form.coverImageUrl,
      };

      let serviceId;
      if (editId) {
        // UPDATE existing service
        const { data } = await api.put(`/services/${editId}`, payload);
        serviceId = data.service?._id || data.service?.id || editId;
      } else {
        // CREATE new service
        const { data } = await api.post('/services', payload);
        if (!data.success) throw new Error(data.message);
        serviceId = data.service._id || data.service.id;
      }

      setSuccess(true);
      setTimeout(() => navigate(`/services/${serviceId}`), 1200);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selCat = CATEGORIES.find(c => c.value === form.category);

  // Show spinner while loading edit data
  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-16">
        <Loader className="h-8 w-8 animate-spin text-stripe-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stripe-bg pt-16 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-stripe-muted hover:text-stripe-purple font-medium mb-6 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stripe-purple/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-stripe-purple" />
            </div>
            <div>
              <h1 className="font-display font-bold text-stripe-slate text-3xl leading-tight">
                {editId ? 'Edit Service' : 'Post a Service'}
              </h1>
              <p className="text-stripe-muted text-sm mt-0.5">
                {editId ? 'Update your service details below' : 'Share your skills with campus peers and start earning'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6 animate-pulse-once">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold text-sm">{editId ? 'Service updated!' : 'Service posted!'} Redirecting…</span>
          </div>
        )}

        {/* ── API error ── */}
        {apiError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Category selector ── */}
          <div className="stripe-card bg-white p-6">
            <label className="form-label flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-stripe-purple" />
              <span>Category <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = form.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    id={`cat-btn-${cat.value.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      setForm(f => ({ ...f, category: cat.value }));
                      setErrors(e => ({ ...e, category: undefined }));
                    }}
                    className="relative p-4 rounded-xl border-2 text-left transition-all duration-200 group"
                    style={{
                      borderColor: isSelected ? cat.color : '#E6EBF1',
                      background: isSelected ? catBg[cat.value] : '#fff',
                      boxShadow: isSelected ? `0 0 0 3px ${cat.color}22` : 'none',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: `${cat.color}18` }}>
                      <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <div className="text-sm font-bold text-stripe-slate">{cat.label}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: cat.color }}>
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="mt-2 text-xs text-red-500 font-medium">{errors.category}</p>}
          </div>

          {/* ── Cover Image Upload ── */}
          <div className="stripe-card bg-white p-6">
            <label className="form-label flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-stripe-purple" />
              <span>Cover Image <span className="text-stripe-muted font-normal">(recommended)</span></span>
            </label>
            <p className="text-xs text-stripe-muted mb-4">
              Upload an eye-catching image for your service card. This is the first thing buyers see.
            </p>
            <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all hover:border-stripe-purple"
              style={{ borderColor: form.coverImageUrl ? '#00D4AA' : '#E6EBF1' }}>
              {uploadingCover ? (
                <Loader className="h-8 w-8 animate-spin text-stripe-purple" />
              ) : form.coverImageUrl ? (
                <img src={form.coverImageUrl} alt="Cover preview"
                  className="w-full max-h-48 object-cover rounded-xl" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-stripe-purple/10 flex items-center justify-center">
                    <ImageIcon className="h-7 w-7 text-stripe-purple" />
                  </div>
                  <span className="text-sm font-semibold text-stripe-muted">Click to upload cover image</span>
                  <span className="text-xs text-stripe-muted">JPG, PNG up to 5MB</span>
                </div>
              )}
              {form.coverImageUrl && (
                <span className="text-sm font-semibold" style={{ color: '#00D4AA' }}>
                  Image uploaded ✓ — click to replace
                </span>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploadingCover(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    setForm(f => ({ ...f, coverImageUrl: res.data.url }));
                  } catch {
                    setApiError('Failed to upload image. Please try again.');
                  } finally {
                    setUploadingCover(false);
                  }
                }} disabled={uploadingCover} />
            </label>
            {form.coverImageUrl && (
              <button type="button" onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))}
                className="mt-2 text-xs text-red-500 font-medium hover:underline">Remove image</button>
            )}
          </div>

          {/* ── Title ── */}
          <div className="stripe-card bg-white p-6">
            <label htmlFor="svc-title" className="form-label flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-stripe-purple" />
              <span>Service Title <span className="text-red-500">*</span></span>
            </label>
            <input
              id="svc-title"
              type="text"
              className="stripe-input"
              placeholder="e.g. Python tutoring & debugging help — CS assignments"
              maxLength={120}
              value={form.title}
              onChange={e => {
                setForm(f => ({ ...f, title: e.target.value }));
                setErrors(er => ({ ...er, title: undefined }));
              }}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.title
                ? <p className="text-xs text-red-500 font-medium">{errors.title}</p>
                : <p className="text-xs text-stripe-muted">Be specific: what exactly do you offer?</p>}
              <span className="text-xs text-stripe-muted">{form.title.length}/120</span>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="stripe-card bg-white p-6">
            <label htmlFor="svc-desc" className="form-label flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-stripe-purple" />
              <span>Description <span className="text-red-500">*</span></span>
            </label>
            <textarea
              id="svc-desc"
              rows={6}
              className="stripe-input resize-none"
              placeholder="Describe your service in detail — what you'll deliver, your experience, tools/methods you use, and any requirements from the buyer..."
              maxLength={2000}
              value={form.description}
              onChange={e => {
                setForm(f => ({ ...f, description: e.target.value }));
                setErrors(er => ({ ...er, description: undefined }));
              }}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.description
                ? <p className="text-xs text-red-500 font-medium">{errors.description}</p>
                : <p className="text-xs text-stripe-muted">Min 30 characters — be thorough to attract buyers.</p>}
              <span className="text-xs text-stripe-muted">{form.description.length}/2000</span>
            </div>
          </div>

          {/* ── Price & Delivery ── */}
          <div className="stripe-card bg-white p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label htmlFor="svc-price" className="form-label flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-stripe-purple" />
                  <span>Price (₹) <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stripe-muted font-semibold text-sm">₹</span>
                  <input
                    id="svc-price"
                    type="number"
                    min={50}
                    className="stripe-input pl-8"
                    placeholder="499"
                    value={form.price}
                    onChange={e => {
                      setForm(f => ({ ...f, price: e.target.value }));
                      setErrors(er => ({ ...er, price: undefined }));
                    }}
                  />
                </div>
                {errors.price
                  ? <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.price}</p>
                  : <p className="mt-1.5 text-xs text-stripe-muted">Minimum ₹50. Escrow-protected payment.</p>}
              </div>

              {/* Delivery */}
              <div>
                <label htmlFor="svc-delivery" className="form-label flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-stripe-purple" />
                  <span>Delivery Time <span className="text-red-500">*</span></span>
                </label>
                <select
                  id="svc-delivery"
                  className="stripe-input cursor-pointer"
                  value={form.deliveryDays}
                  onChange={e => {
                    setForm(f => ({ ...f, deliveryDays: e.target.value }));
                    setErrors(er => ({ ...er, deliveryDays: undefined }));
                  }}
                >
                  <option value="">Select days…</option>
                  {DELIVERY_OPTIONS.map(d => (
                    <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>
                  ))}
                </select>
                {errors.deliveryDays && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.deliveryDays}</p>}
              </div>
            </div>
          </div>

          {/* ── Tags ── */}
          <div className="stripe-card bg-white p-6">
            <label className="form-label flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-stripe-purple" />
              <span>Tags <span className="text-stripe-muted font-normal">(optional, max 8)</span></span>
            </label>
            <div className="flex gap-2 flex-wrap mb-3">
              {form.tags.map(t => (
                <span key={t}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#635BFF15', color: '#635BFF' }}>
                  #{t}
                  <button type="button" onClick={() => removeTag(t)}
                    className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="svc-tag-input"
                type="text"
                className="stripe-input"
                placeholder="python, react, calculus… (press Enter or comma)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                disabled={form.tags.length >= 8}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || form.tags.length >= 8}
                className="btn-outline shrink-0 px-4"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-stripe-muted">Tags help students find your service faster.</p>
          </div>

          {/* ── Live Preview ── */}
          {(form.title || form.category) && (
            <div className="stripe-card bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-stripe-muted mb-4">Live Preview</p>
              <div
                className="rounded-xl p-5 border"
                style={{
                  background: selCat ? catBg[selCat.value] : '#F6F9FC',
                  borderColor: selCat ? `${selCat.color}33` : '#E6EBF1',
                }}
              >
                {form.coverImageUrl && (
                  <img src={form.coverImageUrl} alt="Cover"
                    className="w-full h-40 object-cover rounded-xl mb-4" />
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ color: selCat?.color || '#635BFF', background: `${selCat?.color || '#635BFF'}15` }}>
                    {form.category || 'Category'}
                  </span>
                  {form.price && (
                    <span className="font-bold text-stripe-slate">₹{Number(form.price).toLocaleString('en-IN')}</span>
                  )}
                </div>
                <h3 className="font-bold text-stripe-slate text-base leading-snug mb-2">
                  {form.title || 'Your service title will appear here'}
                </h3>
                {form.description && (
                  <p className="text-stripe-muted text-sm line-clamp-2">{form.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-stripe-border">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: selCat?.color || '#635BFF' }}>
                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stripe-slate">{user.name}</div>
                    <div className="text-xs text-stripe-muted">{user.department || 'Student'}</div>
                  </div>
                  {form.deliveryDays && (
                    <span className="ml-auto text-xs text-stripe-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {form.deliveryDays}d delivery
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="flex items-center gap-4 justify-end">
            <Link to="/dashboard" className="btn-ghost text-stripe-muted hover:text-stripe-steel">
              Cancel
            </Link>
            <button
              type="submit"
              id="post-service-submit"
              disabled={submitting || success}
              className="btn-primary px-8 py-3.5 text-base"
            >
              {submitting
                ? <><Loader className="h-4 w-4 animate-spin" /> {editId ? 'Saving…' : 'Publishing…'}</>
                : success
                ? <><CheckCircle className="h-4 w-4" /> {editId ? 'Saved!' : 'Published!'}</>
                : <><Zap className="h-4 w-4" /> {editId ? 'Save Changes' : 'Post Service'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
