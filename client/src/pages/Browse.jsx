import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, ChevronRight, ChevronLeft, Loader, X, BadgeCheck, ShoppingBag, Heart, Eye, EyeOff, LayoutGrid, Code, Palette, BookOpen, Coffee, Camera, Trophy, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import LottieLoader from '../components/LottieLoader';
import LottieUrlRenderer from '../components/LottieUrlRenderer';

// Fallback mock data (shown when API is unavailable)
const MOCK = [
  { _id: '1', title: 'Python Tutoring — Assignments & Debugging Help', seller: { name: 'Alex M.', department: "Computer Science '25" }, rating: 4.9, reviewCount: 28, price: 499, category: 'Tech & Coding', avatarBg: '#635BFF', initials: 'AM' },
  { _id: '2', title: 'Logo Design & Brand Identity for Student Clubs',   seller: { name: 'Sarah T.', department: "Fine Arts '26" },          rating: 5.0, reviewCount: 17, price: 399, category: 'Art & Design',   avatarBg: '#FF6B9D', initials: 'ST' },
  { _id: '3', title: 'Calculus 2 & Linear Algebra Study Sessions',       seller: { name: 'David K.', department: "Mathematics '25" },        rating: 4.8, reviewCount: 34, price: 449, category: 'Study Helper',   avatarBg: '#00D4AA', initials: 'DK' },
  { _id: '4', title: 'React & Node.js Web App Development',              seller: { name: 'Priya R.', department: "Computer Science '24" },   rating: 4.7, reviewCount: 12, price: 2999, category: 'Tech & Coding', avatarBg: '#635BFF', initials: 'PR' },
  { _id: '5', title: 'Homemade Paneer Paratha & Campus Tiffin',           seller: { name: 'James L.', department: "Home Science '25" },     rating: 4.9, reviewCount: 21, price: 60, category: 'Food Friendship',  avatarBg: '#FF6348', initials: 'JL' },
  { _id: '6', title: 'Portraits & Campus Event Shoots',             seller: { name: 'Meera S.', department: "Fine Arts '26" },         rating: 4.8, reviewCount: 9,  price: 999, category: 'Photography', avatarBg: '#00B2FF', initials: 'MS' },
];

// Category config — icon only (no text in pills)
const CATS = ['All', 'SendiYou', 'Tech & Coding', 'Art & Design', 'Study Helper', 'Food Friendship', 'Photography', 'Playground', 'Other Talents'];
const catIcon = {
  'All':            <LayoutGrid className="w-5 h-5" />,
  'SendiYou':       <Heart className="w-5 h-5" />,
  'Tech & Coding':  <Code className="w-5 h-5" />,
  'Art & Design':   <Palette className="w-5 h-5" />,
  'Study Helper':   <BookOpen className="w-5 h-5" />,
  'Food Friendship':<Coffee className="w-5 h-5" />,
  'Photography':    <Camera className="w-5 h-5" />,
  'Playground':     <Trophy className="w-5 h-5" />,
  'Other Talents':  <Sparkles className="w-5 h-5" />,
};
const catBg = {
  'SendiYou':        'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Tech & Coding':   'linear-gradient(135deg,#EEF0FF,#DDE0FF)',
  'Art & Design':    'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Study Helper':    'linear-gradient(135deg,#E8FFF8,#C8FFF0)',
  'Food Friendship': 'linear-gradient(135deg,#FFF5F0,#FFE4D6)',
  'Photography':     'linear-gradient(135deg,#EAF8FF,#CBEFFF)',
  'Playground':      'linear-gradient(135deg,#FEF3C7,#FDE68A)',
  'Other Talents':   'linear-gradient(135deg,#F8F0FF,#EEDDFF)',
};
const catColor = {
  'SendiYou': '#EC4899', 'Tech & Coding': '#635BFF', 'Art & Design': '#FF6B9D', 'Study Helper': '#00D4AA',
  'Food Friendship': '#FF6348', 'Photography': '#00B2FF', 'Playground': '#F59E0B', 'Other Talents': '#A855F7',
};

// ── In-Grid Social Banners ─────────────────────────────────────
const SOCIAL_BANNERS = [
  { url: '/social/whatsapp.png', link: 'https://whatsapp.com/channel/0029Va4dI6XKmCPJ1lc5Pa0L', alt: 'Cosen WhatsApp Channel' },
  { url: '/social/instagram.png', link: 'https://www.instagram.com/cosen.hub?igsh=YmpiOTh4aWlxMjg3', alt: 'Cosen Instagram Page' }
];

// ── Gradient fallbacks when no banner is uploaded ──────────────
const FALLBACK_BANNERS = [
  { gradient: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 40%, #0EA5E9 100%)', label: 'Campus Services, Simplified' },
  { gradient: 'linear-gradient(135deg, #1a0533 0%, #3b0764 50%, #7c3aed 100%)', label: 'Connect · Learn · Earn' },
  { gradient: 'linear-gradient(135deg, #042f2e 0%, #065f46 50%, #10b981 100%)', label: 'Student Talent Marketplace' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [search, setSearch]       = useState(searchParams.get('search') || '');
  const [category, setCategory]   = useState(searchParams.get('category') || 'All');
  const [sort, setSort]           = useState('rating');
  const [usingMock, setUsingMock] = useState(false);

  // ── Hero banner state ──────────────────────────────────────────
  const [banners, setBanners]         = useState([]);
  const [bannerIdx, setBannerIdx]     = useState(0);
  const [bannerFading, setBannerFading] = useState(false);
  const bannerTimer = useRef(null);

  const debounceTimer = useRef(null);

  // ── Load banners from API ──────────────────────────────────────
  useEffect(() => {
    api.get('/banners').then(r => {
      if (r.data?.banners?.length) setBanners(r.data.banners);
    }).catch(() => {});
  }, []);

  // ── Auto-advance banner every 5s ──────────────────────────────
  const totalSlides = banners.length || FALLBACK_BANNERS.length;

  const goToSlide = useCallback((idx) => {
    setBannerFading(true);
    setTimeout(() => {
      setBannerIdx(idx);
      setBannerFading(false);
    }, 300);
  }, []);

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIdx(prev => {
        const next = (prev + 1) % totalSlides;
        setBannerFading(true);
        setTimeout(() => setBannerFading(false), 300);
        return next;
      });
    }, 3000);
    return () => clearInterval(bannerTimer.current);
  }, [totalSlides]);

  const prevSlide = () => {
    clearInterval(bannerTimer.current);
    goToSlide((bannerIdx - 1 + totalSlides) % totalSlides);
  };
  const nextSlide = () => {
    clearInterval(bannerTimer.current);
    goToSlide((bannerIdx + 1) % totalSlides);
  };

  // ── Core fetch ──────────────────────────────────────────────────
  const fetchServices = useCallback(async (searchTerm, cat, sortVal) => {
    setLoading(true);
    setUsingMock(false);
    try {
      const params = { sort: sortVal, limit: 12 };
      if (cat !== 'All') params.category = cat;
      if (searchTerm?.trim()) params.search = searchTerm.trim();

      const { data } = await api.get('/services', { params });

      if (data.success && data.services?.length > 0) {
        setServices(data.services);
        setTotal(data.total);
      } else if (data.success && data.services?.length === 0) {
        setServices([]);
        setTotal(0);
      } else {
        throw new Error('No data');
      }
    } catch {
      const filtered = MOCK.filter(s =>
        (cat === 'All' || s.category === cat) &&
        (!searchTerm?.trim() || s.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setServices(filtered);
      setTotal(filtered.length);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounce searchVal -> search ─────────────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (searchVal.trim() !== search) setSearch(searchVal.trim());
    }, 420);
    return () => clearTimeout(debounceTimer.current);
  }, [searchVal, search]);

  // ── Sync URL params ─────────────────────────────────────────────
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    if (urlSearch !== search) { setSearch(urlSearch); setSearchVal(urlSearch); }
    if (urlCategory !== category) setCategory(urlCategory);
  }, [searchParams]);

  useEffect(() => {
    const newParams = {};
    if (search.trim()) newParams.search = search.trim();
    if (category !== 'All') newParams.category = category;
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    if (urlSearch !== search || urlCategory !== category) {
      setSearchParams(newParams, { replace: true });
    }
    fetchServices(search, category, sort);
  }, [search, category, sort, fetchServices]);

  const handleCategoryChange = (cat) => setCategory(cat);
  const clearSearch = () => { setSearchVal(''); setSearch(''); };

  const getInitials = (s) => {
    if (s.initials) return s.initials;
    return s.seller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };
  const getBg = (s) => s.avatarBg || catColor[s.category] || '#635BFF';

  // ── Active banner ──────────────────────────────────────────────
  const activeBanner = banners.length > 0 ? banners[bannerIdx] : FALLBACK_BANNERS[bannerIdx % FALLBACK_BANNERS.length];

  return (
    <div className="min-h-screen bg-white pt-16">

      {/* ── Search bar — ABOVE the banner ──────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <div className="relative flex-1">
            {loading && search
              ? <Loader className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stripe-purple animate-spin" />
              : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            }
            <input
              id="browse-search"
              type="text"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-stripe-purple/20 focus:border-stripe-purple transition-all"
              placeholder="Search for a service…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
            {searchVal && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchServices(search, category, sort)}
            className="px-4 py-2.5 rounded-xl bg-stripe-purple text-white font-semibold text-sm shadow-sm hover:bg-stripe-purple/90 transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Search
          </button>
        </div>
      </div>

      {/* ── Hero Banner Slider — CLEAN, fully visible ────────────── */}
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ aspectRatio: '3780/1819', maxHeight: '52vh', minHeight: '180px' }}>
        {/* Banner image / gradient */}
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-500"
          style={{ opacity: bannerFading ? 0 : 1 }}
        >
          {activeBanner?.url ? (
            <img
              src={activeBanner.url}
              alt={activeBanner.label || 'Banner'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ background: activeBanner?.gradient }} />
          )}
        </div>

        {/* Prev / Next arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(bannerTimer.current); goToSlide(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === bannerIdx ? '20px' : '6px',
                  height: '6px',
                  background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Category icon pills — BELOW the banner ───────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap justify-center">
          {CATS.map(cat => (
            <button
              key={cat}
              id={`browse-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleCategoryChange(cat)}
              title={cat}
              className="w-10 h-10 rounded-full text-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: category === cat
                  ? (catColor[cat] || '#635BFF')
                  : '#F1F5F9',
                border: category === cat
                  ? `2px solid ${catColor[cat] || '#635BFF'}`
                  : '2px solid transparent',
                boxShadow: category === cat
                  ? `0 4px 12px ${(catColor[cat] || '#635BFF')}40`
                  : 'none',
                transform: category === cat ? 'scale(1.15)' : '',
                color: category === cat ? '#fff' : 'inherit',
              }}
            >
              {catIcon[cat] || '•'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stripe-muted">
            {loading
              ? 'Searching…'
              : <>
                  <span className="font-semibold text-stripe-slate">{total}</span> service{total !== 1 ? 's' : ''} found
                  {usingMock && <span className="ml-2 text-xs text-amber-500 font-medium">(demo data)</span>}
                  {category !== 'All' && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: catColor[category] || '#635BFF' }}>
                      {catIcon[category]} {category}
                    </span>
                  )}
                </>
            }
          </p>
          <select
            id="browse-sort"
            className="stripe-input w-auto text-sm cursor-pointer font-semibold"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.75rem', color: sort === 'rating' ? '#635BFF' : '#425466', background: '#F6F9FC' }}
          >
            <option value="rating">⭐ Top Rated First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="-createdAt">Newest First</option>
          </select>
        </div>

        {/* Active search indicator */}
        {search.trim() && !loading && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-stripe-muted">
              Results for&nbsp;
              <span className="font-semibold text-stripe-slate">"{search}"</span>
            </span>
            <button onClick={clearSearch} className="text-xs text-stripe-purple font-semibold hover:underline">
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E6EBF1' }}>
                <div className="skeleton-pulse w-full rounded-none" style={{ aspectRatio: '4/3' }} />
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <div className="skeleton-pulse h-4 w-24" />
                  </div>
                  <div className="skeleton-pulse h-4 w-full mb-2" />
                  <div className="skeleton-pulse h-4 w-3/4 mb-4" />
                  <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #F0F4F8' }}>
                    <div className="skeleton-pulse h-4 w-16" />
                    <div className="skeleton-pulse h-7 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-stripe-bg flex items-center justify-center mx-auto mb-5">
              <Search className="h-8 w-8 text-stripe-muted" />
            </div>
            <p className="text-stripe-slate font-bold text-xl mb-2">No services found</p>
            <p className="text-stripe-muted text-sm mb-6 max-w-xs mx-auto">
              {search
                ? `No results for "${search}". Try a different keyword or browse by category.`
                : 'No services in this category yet. Be the first to post!'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {search && (
                <button onClick={clearSearch} className="btn-outline">
                  Clear search
                </button>
              )}
              <Link to="/services/new" className="btn-primary">
                Post a Service
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, index) => {
              const hasCover = !!s.coverImageUrl;
              const hasAvatar = !!s.seller?.avatar?.url;
              const initials = getInitials(s);
              const bg = getBg(s);

              const isSocialBannerPosition = (index + 1) % 5 === 0;
              const bannerIndex = Math.floor((index + 1) / 5 - 1) % SOCIAL_BANNERS.length;

              return (
              <Fragment key={s._id}>
              <Link
                to={`/services/${s._id}`}
                id={`service-card-${s._id}`}
                className="group block rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'}
              >
                {/* Image area */}
                <div className="p-3 pb-0">
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    {s.category === 'SendiYou' && s.identityHidden ? (
                      hasCover && s.coverImageUrl.endsWith('.json') ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50/50 transition-transform duration-500 group-hover:scale-105 p-6">
                          <LottieUrlRenderer url={s.coverImageUrl} className="w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-400/20 to-rose-400/30">
                          <div className="w-16 h-16 rounded-3xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 animate-pulse">
                            <Heart className="h-8 w-8 fill-white" />
                          </div>
                          <span className="text-[10px] uppercase font-bold text-pink-700 tracking-wider">Incognito Match</span>
                        </div>
                      )
                    ) : hasCover ? (
                      s.coverImageUrl.endsWith('.json') ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50/50 transition-transform duration-500 group-hover:scale-105 p-6">
                          <LottieUrlRenderer url={s.coverImageUrl} className="w-full h-full" />
                        </div>
                      ) : (
                        <img src={s.coverImageUrl} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      )
                    ) : hasAvatar ? (
                      <img src={s.seller.avatar.url} alt={s.seller.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: catBg[s.category] || 'linear-gradient(135deg,#EEF0FF,#DDE0FF)' }}>
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg" style={{ background: bg }}>
                          {initials}
                        </div>
                      </div>
                    )}
                    {/* Category badge */}
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                      style={{ background: 'rgba(255,255,255,0.85)', color: catColor[s.category] || '#635BFF' }}>
                      {s.category}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 pt-4 pb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h3 className="font-bold text-stripe-slate text-[15px] truncate flex items-center gap-1">
                      {s.category === 'SendiYou' && s.identityHidden ? (
                        <span className="text-pink-600 flex items-center gap-1">
                          <EyeOff className="h-3.5 w-3.5 shrink-0" /> {s.displayName || 'Anonymous'}
                        </span>
                      ) : (
                        s.seller?.name || 'Student'
                      )}
                    </h3>
                    {!(s.category === 'SendiYou' && s.identityHidden) && (
                      <BadgeCheck className="h-4.5 w-4.5 shrink-0" style={{ color: '#22c55e' }} />
                    )}
                  </div>

                  {s.category === 'Playground' && (
                    <div className="mb-2.5">
                      {(s.description && s.description.match(/🏟️ \*\*Campus Ground Booked:\*\* Yes/i)) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          🏟️ Campus Ground Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50/50 px-2.5 py-1 rounded-md border border-slate-200">
                          🏟️ Booking Pending
                        </span>
                      )}
                    </div>
                  )}

                  {s.category === 'SendiYou' && (
                    <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                        💌 Preferred: {s.preferredGender || 'Any'}
                      </span>
                      {s.identityHidden ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-50/50 px-2 py-0.5 rounded border border-slate-200">
                          🔒 Incognito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          🔓 Public
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-stripe-muted leading-snug line-clamp-2 mb-4" style={{ minHeight: '2.5rem' }}>
                    {s.title}
                  </p>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F0F4F8' }}>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-stripe-muted">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-stripe-slate">{s.rating?.toFixed(1) || '5.0'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-stripe-muted">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {s.reviewCount || 0}
                      </span>
                    </div>
                    {s.category === 'SendiYou' ? (
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-colors animate-pulse"
                        style={{ background: 'linear-gradient(135deg, #EC4899, #F43F5E)' }}>
                        Connect →
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                        style={{ background: '#F6F9FC', color: '#0A2540' }}>
                        ₹{s.price?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              
              {isSocialBannerPosition && (
                <a 
                  href={SOCIAL_BANNERS[bannerIndex].link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="col-span-1 sm:col-span-2 lg:col-span-3 block rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
                >
                   <img src={SOCIAL_BANNERS[bannerIndex].url} alt={SOCIAL_BANNERS[bannerIndex].alt} className="w-full h-auto object-cover" />
                </a>
              )}
              </Fragment>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
