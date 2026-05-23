import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Code, Palette, UtensilsCrossed, Database, Music,
  Plus, X, ChevronRight, Loader, CheckCircle, AlertCircle,
  Briefcase, Clock, DollarSign, Tag, FileText, Zap, LogIn, Camera, ImageIcon, Trophy, Heart, Eye, EyeOff
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

const CATEGORIES = [
  { value: 'Study Helper', label: 'Study Helper', icon: BookOpen, color: '#00D4AA' },
  { value: 'Tech & Coding', label: 'Tech & Coding', icon: Code, color: '#635BFF' },
  { value: 'Art & Design', label: 'Art & Design', icon: Palette, color: '#FF6B9D' },
  { value: 'Food Friendship', label: 'Food Friendship', icon: UtensilsCrossed, color: '#FF6348' },
  { value: 'Photography', label: 'Photography', icon: Camera, color: '#00B2FF' },
  { value: 'Playground', label: 'Playground', icon: Trophy, color: '#F59E0B' },
  { value: 'SendiYou', label: 'SendiYou 💌', icon: Heart, color: '#EC4899' },
  { value: 'Other Talents', label: 'Other Talents', icon: Music, color: '#A855F7' },
];

// Art & Design subcategory types with descriptions
const ART_DESIGN_SUBTYPES = [
  { value: 'Poster & Banner', label: '🎨 Poster & Banner Help', desc: 'Event posters, promotional banners, flyers' },
  { value: 'Presentation Help', label: '📊 Presentation Help', desc: 'PowerPoint, Canva, Google Slides design' },
  { value: 'Resume Help', label: '📄 Resume Help', desc: 'Professional resume & CV design' },
  { value: 'Instagram Post', label: '📸 Instagram Posts & Thumbnails', desc: 'Feed posts, reels covers, stories' },
  { value: 'YouTube Thumbnail', label: '▶️ YouTube Thumbnails', desc: 'Eye-catching video thumbnails' },
  { value: 'Website UI', label: '🖥️ Website UI Design', desc: 'Figma mockups, wireframes, landing pages' },
  { value: 'Custom Service', label: '✨ Custom Service', desc: 'Describe your unique design need' },
];

// Auto-description templates per subtype
const ART_DESC_TEMPLATES = {
  'Poster & Banner': 'I design eye-catching posters and banners for events, promotions, and personal use. Using professional tools like Canva, Photoshop, or Figma, I will create a high-resolution design tailored to your needs. I provide up to 2 revisions and deliver in PNG/PDF format.',
  'Presentation Help': 'I will design a professional and visually engaging presentation for you. Whether it\'s a college project, pitch deck, or business presentation, I will ensure your slides look polished and communicate your ideas clearly. Delivered as PowerPoint or PDF.',
  'Resume Help': 'I will create a modern, ATS-friendly resume design that stands out to recruiters. Clean layout, professional typography, and tailored to your field. Delivered as PDF and editable format.',
  'Instagram Post': 'I design scroll-stopping Instagram content — feed posts, carousel slides, story templates, and reel covers. Consistent with your brand aesthetic. Delivered as high-res PNG files, ready to post.',
  'YouTube Thumbnail': 'I create bold, click-worthy YouTube thumbnails that increase your video CTR. Bright colors, readable text, and compelling visuals that match your channel brand. Delivered in 1280x720 PNG.',
  'Website UI': 'I design clean and modern website UI/UX mockups using Figma or Adobe XD. From landing pages to full app designs, I create responsive layouts with attention to usability and aesthetics.',
  'Custom Service': '',
};

// Food Friendship subtypes
const FOOD_SUBTYPES = [
  { value: 'Veg', label: '🥬 Vegetarian', desc: 'Pure veg home-cooked meals, snacks & tiffin', emoji: '🥬' },
  { value: 'Non-Veg', label: '🍗 Non-Vegetarian', desc: 'Chicken, egg, fish & meat-based dishes', emoji: '🍗' },
  { value: 'Both', label: '🍱 Both (Veg + Non-Veg)', desc: 'Mixed menu with veg and non-veg options', emoji: '🍱' },
];

// Photography subtypes / camera types
const PHOTOGRAPHY_SUBTYPES = [
  { value: 'DSLR Cameras', label: '📸 DSLR Cameras', desc: 'Professional DSLR photography & shoots' },
  { value: 'Mirrorless Cameras', label: '📷 Mirrorless Cameras', desc: 'High-res mirrorless photography' },
  { value: 'Action Cameras', label: '🎦 Action Cameras', desc: 'Sports, outdoor & action video' },
  { value: 'Point & Shoot', label: '📸 Point & Shoot', desc: 'Compact digital cameras' },
  { value: 'Instant Cameras', label: '🎞️ Instant Cameras', desc: 'Polaroid & instant physical prints' },
];

const DELIVERY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

const catBg = {
  'Study Helper': 'linear-gradient(135deg,#E8FFF8,#C8FFF0)',
  'Tech & Coding': 'linear-gradient(135deg,#EEF0FF,#DDE0FF)',
  'Art & Design': 'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Food Friendship': 'linear-gradient(135deg,#FFF5F0,#FFE4D6)',
  'Photography': 'linear-gradient(135deg,#EAF8FF,#CBEFFF)',
  'Playground': 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
  'SendiYou': 'linear-gradient(135deg,#FFF0F8,#FFD6EB)',
  'Other Talents': 'linear-gradient(135deg,#F8F0FF,#EEDDFF)',
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
    subCategory: '',
    isNegotiable: false,
    price: '',
    deliveryDays: '',
    tags: [],
    coverImageUrl: '',
    portfolioImages: [],
    cameraModel: '',
    gameName: '',
    location: '',
    bookedCampus: 'no',
    playerCount: '',
    // SendiYou fields
    displayName: '',
    preferredGender: 'Any',
    identityHidden: false,
    groupSize: 2,
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(!!editId);


  // ── Load existing service for editing ──────────────
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(`/services/${editId}`);
        const s = data.service;
        let desc = s.description || '';
        let camModel = '';
        const match = desc.match(/\n\n📷 \*\*Camera Model:\*\* (.*)$/);
        if (match) {
          camModel = match[1];
          desc = desc.replace(/\n\n📷 \*\*Camera Model:\*\* (.*)$/, '');
        }

        let gameName = '';
        let locationVal = '';
        let bookedCampusVal = 'no';
        let playerCountVal = '';

        if (s.category === 'Playground') {
          const gameMatch = desc.match(/\n🎮 \*\*Game Name:\*\* (.*)/);
          const bookedMatch = desc.match(/\n🏟️ \*\*Campus Ground Booked:\*\* (Yes|No|yes|no)/i);
          const locMatch = desc.match(/\n📍 \*\*Location:\*\* (.*)/);
          const countMatch = desc.match(/\n👥 \*\*Team Size:\*\* (\d+) members/);

          if (gameMatch) gameName = gameMatch[1];
          if (bookedMatch) bookedCampusVal = bookedMatch[1].toLowerCase();
          if (locMatch) locationVal = locMatch[1];
          if (countMatch) playerCountVal = countMatch[1];

          desc = desc
            .replace(/\n🎮 \*\*Game Name:\*\* .*/, '')
            .replace(/\n🏟️ \*\*Campus Ground Booked:\*\* .*/, '')
            .replace(/\n📍 \*\*Location:\*\* .*/, '')
            .replace(/\n👥 \*\*Team Size:\*\* .*/, '')
            .trim();
        }

        setForm({
          title: s.title || '',
          description: desc,
          category: s.category || '',
          subCategory: s.subCategory || '',
          isNegotiable: !!s.isNegotiable,
          price: s.price?.toString() || '',
          deliveryDays: s.deliveryDays?.toString() || '',
          tags: s.tags || [],
          coverImageUrl: s.images?.[0] || s.coverImageUrl || '',
          portfolioImages: s.portfolioImages || [],
          cameraModel: camModel,
          gameName,
          location: locationVal,
          bookedCampus: bookedCampusVal,
          playerCount: playerCountVal,
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

    // SendiYou-specific
    if (form.category === 'SendiYou') {
      if (!form.displayName || !form.displayName.trim())
        e.displayName = 'Please enter a display name.';
      return e; // no price/delivery validation for SendiYou
    }

    if ((form.category === 'Study Helper' || form.category === 'Art & Design' || form.category === 'Food Friendship' || form.category === 'Photography') && !form.subCategory)
      e.subCategory = 'Please select a service type.';
    if (form.category === 'Photography' && (!form.cameraModel || !form.cameraModel.trim()))
      e.cameraModel = 'Please write your camera model.';
    if (form.category === 'Playground') {
      if (!form.gameName || !form.gameName.trim()) e.gameName = 'Please enter the game name.';
      if (!form.location || !form.location.trim()) e.location = 'Please enter play location.';
      if (!form.playerCount || isNaN(form.playerCount) || Number(form.playerCount) <= 0) e.playerCount = 'Please enter playing member count.';
    }
    if (!form.price || isNaN(form.price) || Number(form.price) < (form.category === 'Food Friendship' ? 10 : 50))
      e.price = form.category === 'Food Friendship' ? 'Price must be at least ₹10.' : 'Price must be at least ₹50.';
    if (!form.deliveryDays)
      e.deliveryDays = 'Please select a delivery time.';
    return e;
  };

  // ── Portfolio image upload helper ──────────────────
  const uploadPortfolioImage = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url;
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
      let finalDescription = form.description.trim();
      if (form.category === 'Photography' && form.cameraModel) {
        finalDescription += `\n\n📷 **Camera Model:** ${form.cameraModel.trim()}`;
      } else if (form.category === 'Playground') {
        const campusStatus = form.bookedCampus === 'yes' ? 'Yes' : 'No';
        finalDescription += `\n\n🎮 **Game Name:** ${form.gameName.trim()}\n🏟️ **Campus Ground Booked:** ${campusStatus}\n📍 **Location:** ${form.location.trim()}\n👥 **Team Size:** ${Number(form.playerCount)} members`;
      }

      const payload = {
        title: form.title.trim(),
        description: finalDescription,
        category: form.category,
        subCategory: form.subCategory,
        isNegotiable: form.isNegotiable,
        price: form.category === 'SendiYou' ? 0 : Number(form.price),
        deliveryDays: form.category === 'SendiYou' ? 7 : Number(form.deliveryDays),
        tags: form.tags,
        coverImageUrl: form.coverImageUrl,
        portfolioImages: form.portfolioImages,
        // SendiYou specific
        ...(form.category === 'SendiYou' && {
          displayName: form.displayName.trim(),
          preferredGender: form.preferredGender,
          identityHidden: form.identityHidden,
          groupSize: Number(form.groupSize) || 1,
        }),
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

          {/* ── Sub-Category for Study Helper ── */}
          {form.category === 'Study Helper' && (
            <div className="stripe-card bg-white p-6 mt-6">
              <label className="form-label flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-stripe-purple" />
                <span>Help Type <span className="text-red-500">*</span></span>
              </label>
              <select
                className="stripe-input cursor-pointer"
                value={form.subCategory}
                onChange={e => {
                  setForm(f => ({ ...f, subCategory: e.target.value }));
                  setErrors(er => ({ ...er, subCategory: undefined }));
                }}
              >
                <option value="">Select help type…</option>
                {['Assignment Help', 'Tutorial Help', 'Manual Help', 'Custom Help'].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {errors.subCategory && <p className="mt-2 text-xs text-red-500 font-medium">{errors.subCategory}</p>}
            </div>
          )}

          {/* ── Art & Design: Service Type Tiles ── */}
          {form.category === 'Art & Design' && (
            <div className="stripe-card bg-white p-6">
              <label className="form-label flex items-center gap-2 mb-1">
                <Palette className="h-4 w-4 text-stripe-purple" />
                <span>Service Type <span className="text-red-500">*</span></span>
              </label>
              <p className="text-xs text-stripe-muted mb-4">Select the type of design service you offer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ART_DESIGN_SUBTYPES.map(sub => {
                  const isSelected = form.subCategory === sub.value;
                  return (
                    <button
                      key={sub.value}
                      type="button"
                      onClick={() => {
                        const template = ART_DESC_TEMPLATES[sub.value] || '';
                        setForm(f => ({
                          ...f,
                          subCategory: sub.value,
                          // Auto-fill description only if empty or was a previous template
                          description: (!f.description || Object.values(ART_DESC_TEMPLATES).includes(f.description)) ? template : f.description,
                        }));
                        setErrors(er => ({ ...er, subCategory: undefined }));
                      }}
                      className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200"
                      style={{
                        borderColor: isSelected ? '#FF6B9D' : '#E6EBF1',
                        background: isSelected ? '#FFF0F6' : '#fff',
                        boxShadow: isSelected ? '0 0 0 3px #FF6B9D22' : 'none',
                      }}
                    >
                      <span className="text-2xl leading-none mt-0.5">{sub.label.split(' ')[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stripe-slate">{sub.label.split(' ').slice(1).join(' ')}</div>
                        <div className="text-xs text-stripe-muted mt-0.5">{sub.desc}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#FF6B9D' }} />
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.subCategory && <p className="mt-3 text-xs text-red-500 font-medium">{errors.subCategory}</p>}
            </div>
          )}

          {/* ── Photography: Camera Type Selector ── */}
          {form.category === 'Photography' && (
            <div className="stripe-card bg-white p-6">
              <label className="form-label flex items-center gap-2 mb-1">
                <Camera className="h-4 w-4 text-stripe-purple" />
                <span>Camera Type <span className="text-red-500">*</span></span>
              </label>
              <p className="text-xs text-stripe-muted mb-4">Select the primary type of camera you use for this service</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {PHOTOGRAPHY_SUBTYPES.map(sub => {
                  const isSelected = form.subCategory === sub.value;
                  return (
                    <button
                      key={sub.value}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, subCategory: sub.value }));
                        setErrors(er => ({ ...er, subCategory: undefined }));
                      }}
                      className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200"
                      style={{
                        borderColor: isSelected ? '#00B2FF' : '#E6EBF1',
                        background: isSelected ? '#EAF8FF' : '#fff',
                        boxShadow: isSelected ? '0 0 0 3px #00B2FF22' : 'none',
                      }}
                    >
                      <span className="text-2xl leading-none mt-0.5">{sub.label.split(' ')[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stripe-slate">{sub.label.split(' ').slice(1).join(' ')}</div>
                        <div className="text-xs text-stripe-muted mt-0.5">{sub.desc}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#00B2FF' }} />
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.subCategory && <p className="mt-3 text-xs text-red-500 font-medium">{errors.subCategory}</p>}
            </div>
          )}

          {/* ── Photography: Camera Model Input ── */}
          {form.category === 'Photography' && (
            <div className="stripe-card bg-white p-6">
              <label htmlFor="svc-camera-model" className="form-label flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-stripe-purple" />
                <span>Camera Model <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                id="svc-camera-model"
                className="stripe-input"
                placeholder="e.g. Sony Alpha 7 IV, Canon EOS R6, GoPro Hero 11..."
                value={form.cameraModel || ''}
                onChange={e => {
                  setForm(f => ({ ...f, cameraModel: e.target.value }));
                  setErrors(er => ({ ...er, cameraModel: undefined }));
                }}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.cameraModel
                  ? <p className="text-xs text-red-500 font-medium">{errors.cameraModel}</p>
                  : <p className="text-xs text-stripe-muted">Which camera model will you be using for this shoot?</p>}
              </div>
            </div>
          )}
          {/* ── Playground Match Fields ── */}
          {form.category === 'Playground' && (
            <div className="stripe-card bg-white p-6 space-y-6">
              <div className="border-b border-stripe-border pb-4">
                <h3 className="font-display font-bold text-stripe-slate text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-stripe-purple" />
                  <span>Playground Match Details</span>
                </h3>
                <p className="text-xs text-stripe-muted mt-1">Configure your game details, player counts, and booking status.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="svc-game-name" className="form-label flex items-center gap-2 mb-2">
                    <span>Game/Sport Name <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    id="svc-game-name"
                    className="stripe-input"
                    placeholder="e.g. Cricket, Football, Valorant, BGMI..."
                    value={form.gameName || ''}
                    onChange={e => {
                      setForm(f => ({ ...f, gameName: e.target.value }));
                      setErrors(er => ({ ...er, gameName: undefined }));
                    }}
                  />
                  {errors.gameName && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.gameName}</p>}
                </div>

                <div>
                  <label htmlFor="svc-player-count" className="form-label flex items-center gap-2 mb-2">
                    <span>Number of Players <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    id="svc-player-count"
                    min="1"
                    className="stripe-input"
                    placeholder="e.g. 5 (members in team)"
                    value={form.playerCount || ''}
                    onChange={e => {
                      setForm(f => ({ ...f, playerCount: e.target.value }));
                      setErrors(er => ({ ...er, playerCount: undefined }));
                    }}
                  />
                  {errors.playerCount && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.playerCount}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="svc-location" className="form-label flex items-center gap-2 mb-2">
                  <span>Match Location / Court <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  id="svc-location"
                  className="stripe-input"
                  placeholder="e.g. Main Playground Campus, Sports Complex Court A..."
                  value={form.location || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, location: e.target.value }));
                    setErrors(er => ({ ...er, location: undefined }));
                  }}
                />
                {errors.location && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.location}</p>}
              </div>

              <div>
                <label className="form-label flex items-center gap-2 mb-2">
                  <span>Did you book the playground/court on campus? <span className="text-red-500">*</span></span>
                </label>
                <p className="text-xs text-stripe-muted mb-3">Whether you have already confirmed the ground booking on campus.</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, bookedCampus: 'yes' }))}
                    className="flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 text-center"
                    style={{
                      borderColor: form.bookedCampus === 'yes' ? '#F59E0B' : '#E6EBF1',
                      background: form.bookedCampus === 'yes' ? '#FEF3C7' : '#fff',
                      color: form.bookedCampus === 'yes' ? '#D97706' : '#4F5B66',
                      boxShadow: form.bookedCampus === 'yes' ? '0 0 0 3px #F59E0B22' : 'none',
                    }}
                  >
                    🏟️ Yes, Booked
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, bookedCampus: 'no' }))}
                    className="flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 text-center"
                    style={{
                      borderColor: form.bookedCampus === 'no' ? '#94A3B8' : '#E6EBF1',
                      background: form.bookedCampus === 'no' ? '#F1F5F9' : '#fff',
                      color: form.bookedCampus === 'no' ? '#475569' : '#4F5B66',
                      boxShadow: form.bookedCampus === 'no' ? '0 0 0 3px #94A3B822' : 'none',
                    }}
                  >
                    ⏳ Booking Pending / No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SendiYou Connection Fields ── */}
          {form.category === 'SendiYou' && (
            <div className="stripe-card bg-white p-6 space-y-6" style={{ border: '2px solid #FBCFE8' }}>
              <div className="border-b border-pink-100 pb-4">
                <h3 className="font-display font-bold text-stripe-slate text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                  <span>SendiYou Connection Details</span>
                </h3>
                <p className="text-xs text-stripe-muted mt-1">
                  Set up your anonymous campus connection request. Your real identity can optionally be hidden.
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="svc-display-name" className="form-label flex items-center gap-2 mb-2">
                  <span>Your Display Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  id="svc-display-name"
                  className="stripe-input"
                  placeholder="e.g. Stargazer, Campus Foodie, Night Owl..."
                  value={form.displayName || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, displayName: e.target.value }));
                    setErrors(er => ({ ...er, displayName: undefined }));
                  }}
                  maxLength={40}
                />
                {errors.displayName
                  ? <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.displayName}</p>
                  : <p className="mt-1.5 text-xs text-stripe-muted">This is the name shown publicly (not your real name unless you want).</p>}
              </div>

              {/* Preferred Gender */}
              <div>
                <label className="form-label flex items-center gap-2 mb-3">
                  <span>I want to connect with a...</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Any'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, preferredGender: g }))}
                      className="py-3 px-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 text-center"
                      style={{
                        borderColor: form.preferredGender === g ? '#EC4899' : '#E6EBF1',
                        background: form.preferredGender === g ? '#FFF0F8' : '#FAFAFA',
                        color: form.preferredGender === g ? '#BE185D' : '#64748B',
                        boxShadow: form.preferredGender === g ? '0 0 0 3px #EC489922' : 'none',
                      }}
                    >
                      {g === 'Male' ? '👨 Male' : g === 'Female' ? '👩 Female' : '🌈 Any Gender'}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stripe-muted">Only users of the selected gender can accept your connection request.</p>
              </div>

              {/* Group Size */}
              <div>
                <label htmlFor="svc-group-size" className="form-label flex items-center gap-2 mb-2">
                  <span>Group Size <span className="text-red-500">*</span></span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, groupSize: Math.max(1, (Number(f.groupSize) || 1) - 1) }))}
                    className="w-10 h-10 rounded-xl border-2 border-stripe-border bg-slate-50 text-stripe-slate font-bold text-lg flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition-all"
                  >−</button>
                  <input
                    type="number"
                    id="svc-group-size"
                    className="stripe-input text-center w-24 font-bold text-lg"
                    min={1}
                    max={50}
                    value={form.groupSize || 1}
                    onChange={e => setForm(f => ({ ...f, groupSize: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) }))}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, groupSize: Math.min(50, (Number(f.groupSize) || 1) + 1) }))}
                    className="w-10 h-10 rounded-xl border-2 border-stripe-border bg-slate-50 text-stripe-slate font-bold text-lg flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition-all"
                  >+</button>
                  <span className="text-sm text-stripe-muted">
                    {form.groupSize <= 1 ? '1 person only (private)' : `Up to ${form.groupSize} people can join`}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-stripe-muted">Set how many students can join this connection. e.g. 10 for a campus cricket team group chat.</p>
              </div>

              {/* Identity Hide Toggle */}
              <div>
                <label className="form-label flex items-center gap-2 mb-3">
                  <span>Hide my identity on the platform?</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, identityHidden: true }))}
                    className="flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      borderColor: form.identityHidden ? '#EC4899' : '#E6EBF1',
                      background: form.identityHidden ? '#FFF0F8' : '#FAFAFA',
                      color: form.identityHidden ? '#BE185D' : '#64748B',
                      boxShadow: form.identityHidden ? '0 0 0 3px #EC489922' : 'none',
                    }}
                  >
                    <EyeOff className="h-4 w-4" /> Yes, stay anonymous
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, identityHidden: false }))}
                    className="flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      borderColor: !form.identityHidden ? '#10B981' : '#E6EBF1',
                      background: !form.identityHidden ? '#F0FDF4' : '#FAFAFA',
                      color: !form.identityHidden ? '#065F46' : '#64748B',
                      boxShadow: !form.identityHidden ? '0 0 0 3px #10B98122' : 'none',
                    }}
                  >
                    <Eye className="h-4 w-4" /> No, show my profile
                  </button>
                </div>
                {form.identityHidden && (
                  <div className="mt-3 text-xs bg-pink-50 border border-pink-200 text-pink-700 rounded-lg p-3 leading-relaxed">
                    🔒 <strong>Anonymous Mode:</strong> Your real name, photo, and profile will be hidden from all platform users. This post will also not appear in your public profile.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Portfolio / Past Work Samples ── */}
          {(form.category === 'Art & Design' || form.category === 'Photography') && (
            <div className="stripe-card bg-white p-6">
              <label className="form-label flex items-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-stripe-purple" />
                <span>Past Work Samples <span className="text-stripe-muted font-normal">(optional, up to 5)</span></span>
              </label>
              <p className="text-xs text-stripe-muted mb-4">
                {form.category === 'Photography' 
                  ? 'Upload high-quality images and video clips from your past photography shoots.'
                  : 'Upload examples of your previous design work. This greatly increases buyer trust and conversions.'}
              </p>

              {/* Portfolio media grid */}
              {form.portfolioImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {form.portfolioImages.map((url, idx) => {
                    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                    return (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-stripe-border aspect-video">
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover" controls={false} muted loop playsInline autoPlay />
                        ) : (
                          <img src={url} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, portfolioImages: f.portfolioImages.filter((_, i) => i !== idx) }))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-1 left-2 text-white text-xs font-bold opacity-70">#{idx + 1}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {form.portfolioImages.length < 5 && (
                <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all hover:border-stripe-purple"
                  style={{ borderColor: uploadingPortfolio ? '#635BFF' : '#E6EBF1' }}>
                  {uploadingPortfolio ? (
                    <><Loader className="h-7 w-7 animate-spin text-stripe-purple" /><span className="text-sm text-stripe-muted">Uploading…</span></>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-pink-500" />
                      </div>
                      <span className="text-sm font-semibold text-stripe-muted">
                        {form.category === 'Photography' ? 'Add past work sample (image/video)' : 'Add work sample image'}
                      </span>
                      <span className="text-xs text-stripe-muted">
                        {5 - form.portfolioImages.length} remaining · {form.category === 'Photography' ? 'JPG, PNG, MP4 up to 15MB' : 'JPG, PNG up to 5MB'}
                      </span>
                    </>
                  )}
                  <input type="file" accept={form.category === 'Photography' ? "image/*,video/*" : "image/*"} multiple className="hidden"
                    disabled={uploadingPortfolio}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (!files.length) return;
                      const allowed = 5 - form.portfolioImages.length;
                      const toUpload = files.slice(0, allowed);
                      setUploadingPortfolio(true);
                      try {
                        const urls = await Promise.all(toUpload.map(uploadPortfolioImage));
                        setForm(f => ({ ...f, portfolioImages: [...f.portfolioImages, ...urls] }));
                      } catch {
                        setApiError('Failed to upload one or more files. Please try again.');
                      } finally {
                        setUploadingPortfolio(false);
                        e.target.value = '';
                      }
                    }} />
                </label>
              )}
            </div>
          )}

          {/* ── Food Friendship: Food Type Selector ── */}
          {form.category === 'Food Friendship' && (
            <div className="stripe-card bg-white p-6">
              <label className="form-label flex items-center gap-2 mb-1">
                <UtensilsCrossed className="h-4 w-4" style={{ color: '#FF6348' }} />
                <span>Food Type <span className="text-red-500">*</span></span>
              </label>
              <p className="text-xs text-stripe-muted mb-4">What type of food do you offer?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FOOD_SUBTYPES.map(sub => {
                  const isSelected = form.subCategory === sub.value;
                  return (
                    <button
                      key={sub.value}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, subCategory: sub.value }));
                        setErrors(er => ({ ...er, subCategory: undefined }));
                      }}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 text-center transition-all duration-200"
                      style={{
                        borderColor: isSelected ? '#FF6348' : '#E6EBF1',
                        background: isSelected ? '#FFF5F0' : '#fff',
                        boxShadow: isSelected ? '0 0 0 3px #FF634822' : 'none',
                      }}
                    >
                      <span className="text-3xl">{sub.emoji}</span>
                      <div className="text-sm font-bold text-stripe-slate">{sub.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-xs text-stripe-muted">{sub.desc}</div>
                      {isSelected && <CheckCircle className="h-5 w-5" style={{ color: '#FF6348' }} />}
                    </button>
                  );
                })}
              </div>
              {errors.subCategory && <p className="mt-3 text-xs text-red-500 font-medium">{errors.subCategory}</p>}
            </div>
          )}


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
              <span>{
                form.category === 'Food Friendship' ? 'Food Item Name'
                  : form.category === 'Art & Design' ? 'Design Service Title'
                    : form.category === 'Study Helper' ? 'Tutoring / Help Title'
                      : form.category === 'Tech & Coding' ? 'Tech Service Title'
                        : form.category === 'Photography' ? 'Photography Service Title'
                          : form.category === 'Playground' ? 'Match Title'
                            : 'Service Title'
              } <span className="text-red-500">*</span></span>
            </label>
            <input
              id="svc-title"
              type="text"
              className="stripe-input"
              placeholder={
                form.category === 'Food Friendship' ? 'e.g. Homemade Biryani, Pasta, Momos, Tiffin Box…'
                  : form.category === 'Art & Design' ? 'e.g. Professional Logo Design & Brand Identity'
                    : form.category === 'Study Helper' ? 'e.g. Calculus II Tutoring & assignment help'
                      : form.category === 'Tech & Coding' ? 'e.g. Full-Stack Web App Development with React'
                        : form.category === 'Photography' ? 'e.g. Campus Portraits, Event Photography, Graduation Shoot…'
                          : form.category === 'Playground' ? 'e.g. 5v5 Valorant Custom Match, Friendly Football Match 11v11…'
                            : 'e.g. Describe your service in a few words'
              }
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
              <span>{
                form.category === 'Food Friendship' ? 'Food Description'
                  : form.category === 'Art & Design' ? 'Design Description'
                    : form.category === 'Study Helper' ? 'Help Description'
                      : form.category === 'Tech & Coding' ? 'Technical Description'
                        : form.category === 'Photography' ? 'Photography Description'
                          : form.category === 'Playground' ? 'Match Rules & Regulations'
                            : 'Description'
              } <span className="text-red-500">*</span></span>
            </label>
            <textarea
              id="svc-desc"
              rows={6}
              className="stripe-input resize-none"
              placeholder={
                form.category === 'Food Friendship' ? `Describe your food — ingredients, taste, portion size, how it's prepared, hygiene practices, and pickup/delivery options…`
                  : form.category === 'Art & Design' ? `Describe your design service — tools you use (Canva, Figma, Photoshop), revisions included, file formats delivered…`
                    : form.category === 'Study Helper' ? `Describe what you teach — subjects, topics, your experience, teaching style, session format (online/offline)…`
                      : form.category === 'Tech & Coding' ? `Describe your tech service — languages/frameworks, what you'll build, your experience, delivery format…`
                        : form.category === 'Photography' ? `Describe your photography service — camera gear/lenses, editing software, photo/video deliverables, style, and duration of the shoot…`
                          : form.category === 'Playground' ? `Describe the match rules and regulations — entry requirements, game mode, map settings, banned weapons/abilities, and prize structures…`
                            : `Describe your service in detail — what you'll deliver, your experience, tools/methods you use…`
              }
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

          {/* ── Price & Delivery (hidden for SendiYou) ── */}
          {form.category !== 'SendiYou' && (
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

                <label className="flex items-center gap-2 mt-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-stripe-purple"
                    checked={form.isNegotiable}
                    onChange={e => setForm(f => ({ ...f, isNegotiable: e.target.checked }))}
                  />
                  <span className="text-sm font-medium text-stripe-slate group-hover:text-stripe-purple transition-colors">
                    Negotiable Price
                  </span>
                </label>
                <p className="text-xs text-stripe-muted mt-1 ml-6">
                  Allow buyers to request a custom price in the order chat.
                </p>
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
          )}

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
