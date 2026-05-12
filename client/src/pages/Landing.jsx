import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/BrandLogo';
import { ChevronRight, ChevronLeft, Star, Shield, Zap, BookOpen, Code, Palette, PenTool, Database, Music, Search, Loader, ShieldCheck, BadgeCheck, ShoppingBag } from 'lucide-react';
import heroBgVideo from '../assets/landing_page_back_video.mp4';
import person1 from '../assets/person1.jpg';
import person2 from '../assets/person2.jpg';
import person3 from '../assets/person3.jpg';
import person4 from '../assets/person4.jpg';
import person5 from '../assets/person5.jpg';

const categories = [
  { name: 'Study Helper', icon: BookOpen, color: '#0EA878', bg: '#E8FFF8', count: 120, desc: 'Tutoring & exam prep' },
  { name: 'Tech & Coding', icon: Code, color: '#4F3EFF', bg: '#EEEEFF', count: 85, desc: 'Websites, apps, scripts' },
  { name: 'Art & Design', icon: Palette, color: '#D63E82', bg: '#FFF0F6', count: 64, desc: 'Logos, UI & illustrations' },
  { name: 'Writing & CV', icon: PenTool, color: '#1A8FC1', bg: '#EAF5FF', count: 92, desc: 'Proofreading & CVs' },
  { name: 'Research & Data', icon: Database, color: '#D4820A', bg: '#FFF8EC', count: 41, desc: 'Data analysis & Excel' },
  { name: 'Other Talents', icon: Music, color: '#8B3FC9', bg: '#F6EFFF', count: 112, desc: 'Music, fitness, languages' },
];

const catColor = {
  'Tech & Coding': '#635BFF', 'Art & Design': '#FF6B9D', 'Study Helper': '#00D4AA',
  'Writing & CV': '#4FC3F7', 'Research & Data': '#FF9F43', 'Other Talents': '#A855F7',
};

const catBg = {
  'Tech & Coding': 'linear-gradient(135deg,#EEF0FF,#DDE0FF)',
  'Art & Design': 'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Study Helper': 'linear-gradient(135deg,#E8FFF8,#C8FFF0)',
  'Writing & CV': 'linear-gradient(135deg,#F0F8FF,#DDEEFF)',
  'Research & Data': 'linear-gradient(135deg,#FFF8EE,#FFE8CC)',
  'Other Talents': 'linear-gradient(135deg,#F8F0FF,#EEDDFF)',
};

// Fallback featured mock data if DB is empty
const MOCK_FEATURED = [
  {
    _id: '1',
    title: 'Python Debugging & Full CS Tutoring',
    description: 'Struggling with DSA, OOP, or Python assignments? I offer 1-on-1 sessions, assignment help, and project reviews. 3 semesters of TA experience.',
    seller: { name: 'Arjun Mehta', department: "Computer Science '25", avatar: person2 },
    rating: 4.9, reviewCount: 28, price: 499,
    category: 'Tech & Coding',
    tags: ['Python', 'DSA', 'Debugging'],
    deliveryDays: 1,
    ordersCompleted: 43,
  },
  {
    _id: '2',
    title: 'Logo & Brand Identity Design for Your Club',
    description: 'Professional logo, color palette, and brand guide for your student club or startup. Unlimited revisions in 48 hours — guaranteed satisfaction.',
    seller: { name: 'Priya Patel', department: "Fine Arts '26", avatar: person1 },
    rating: 5.0, reviewCount: 17, price: 599,
    category: 'Art & Design',
    tags: ['Logo', 'Branding', 'Figma'],
    deliveryDays: 2,
    ordersCompleted: 29,
  },
  {
    _id: '3',
    title: 'Calculus II & Linear Algebra Tutoring',
    description: 'Gold medallist in Engineering Mathematics. Covers limits, integrals, eigen values, and exam prep. Session recordings provided after every class.',
    seller: { name: 'Rahul Sharma', department: "Mathematics '25", avatar: person3 },
    rating: 4.8, reviewCount: 34, price: 449,
    category: 'Study Helper',
    tags: ['Calculus', 'Linear Algebra', 'Exam Prep'],
    deliveryDays: 1,
    ordersCompleted: 61,
  },
  {
    _id: '4',
    title: 'Professional SOP & Resume Writing',
    description: 'Ex-placement committee member. I craft ATS-friendly resumes, cover letters, and SOPs that get shortlisted. 85%+ placement success rate among my clients.',
    seller: { name: 'Anjali Gupta', department: "MBA '25", avatar: person4 },
    rating: 4.9, reviewCount: 41, price: 349,
    category: 'Writing & CV',
    tags: ['Resume', 'SOP', 'Cover Letter'],
    deliveryDays: 2,
    ordersCompleted: 78,
  },
  {
    _id: '5',
    title: 'Data Analysis & Excel Dashboard',
    description: 'I build clean Excel / Google Sheets dashboards, run statistical analyses, and create visualisations for your project or internship report. SPSS & R available.',
    seller: { name: 'Divya Nair', department: "Statistics '26", avatar: person5 },
    rating: 4.7, reviewCount: 22, price: 699,
    category: 'Research & Data',
    tags: ['Excel', 'Data Viz', 'Statistics'],
    deliveryDays: 3,
    ordersCompleted: 35,
  },
  {
    _id: '6',
    title: 'Acoustic Guitar Lessons — Beginner to Intermediate',
    description: 'Certified ABRSM Grade 6 guitarist. I teach chords, fingerpicking, strumming techniques, and song covers. Flexible slots, patient teaching style.',
    seller: { name: 'Karan Singh', department: "Music '27", avatar: person3 },
    rating: 5.0, reviewCount: 9, price: 299,
    category: 'Other Talents',
    tags: ['Guitar', 'Music', 'Beginner-friendly'],
    deliveryDays: 1,
    ordersCompleted: 18,
  },
];

const steps = [
  { number: '01', title: 'Sign up with your .edu email', desc: 'Instant campus verification — no strangers, only real peers from your university.' },
  { number: '02', title: 'Browse or post a service', desc: 'Find the help you need, or list your skills and start accepting orders from classmates.' },
  { number: '03', title: 'Pay safely via escrow', desc: 'Money is held securely until you confirm delivery. Stripe-powered and fully protected.' },
];

const getInitials = (s) =>
  s.seller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
const getBg = (s) => catColor[s.category] || '#635BFF';

export default function Landing() {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const carouselRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // Slow down the hero background video for a cinematic feel
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const setSpeed = () => { vid.playbackRate = 0.65; };
    vid.addEventListener('loadedmetadata', setSpeed);
    if (vid.readyState >= 1) setSpeed(); // already loaded
    return () => vid.removeEventListener('loadedmetadata', setSpeed);
  }, []);

  // If user is already logged in, skip landing page and go to browse
  useEffect(() => {
    if (user) navigate('/browse', { replace: true });
  }, [user, navigate]);

  // Auto-play for How it Works steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Scroll-reveal fade-up observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* === HERO — Fullscreen video, responsive elements === */}
      <section
        ref={heroRef}
        className="hero-v2"
        style={{
          position: 'relative',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          height: '100svh',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* ── Video: fullscreen, stretched to hide black side bars ── */}
        <video
          ref={videoRef}
          src={heroBgVideo}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            /* scaleX hides letterbox bars; scaleY keeps vertical coverage */
            transform: 'translate(-50%, -50%) scaleX(1.45) scaleY(1.18)',
            minWidth: '100%',
            minHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            zIndex: 0,
          }}
        />

        {/* Dark gradient: stronger on mobile (less real-estate), lighter on desktop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              'linear-gradient(to top, rgba(8,14,36,0.95) 0%, rgba(8,14,36,0.75) 30%, rgba(8,14,36,0.30) 58%, rgba(8,14,36,0.08) 80%, transparent 100%)',
          }}
        />

        {/* ── Content: pinned to bottom, full responsive padding ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10
                     px-5 pb-8
                     sm:px-8 sm:pb-10
                     md:px-12 md:pb-12
                     lg:px-16 lg:pb-14
                     xl:px-20"
          style={{ maxWidth: '680px' }}
        >
          {/* Verification Badge — Technical, Developer-Built Aesthetic */}
          <div className="hero-verified-badge mb-4 sm:mb-5">
            <div className="status-dot shrink-0" />
            <ShieldCheck className="w-3 h-3 text-[#34D399] shrink-0" />
            <span>Verified Peer Network • Secure</span>
          </div>

          {/* Headline */}
          <h1
            className="hero-headline font-extrabold leading-[1.08] tracking-tight text-white mb-2 sm:mb-3"
            style={{ fontSize: 'clamp(2.2rem, 6.5vw, 4.4rem)', fontFamily: 'Inter, sans-serif' }}
          >
            <span className="hero-word block">The campus</span>
            <span className="hero-word block">
              marketplace&nbsp;<span className="hero-highlight">built</span>
            </span>
            <span className="hero-word block">
              <span className="hero-highlight">for students.</span>
            </span>
          </h1>

          {/* Sub-text */}
          <p
            className="font-medium leading-relaxed mb-4 sm:mb-5"
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              maxWidth: '520px',
            }}
          >
            Hire verified campus peers for tutoring, coding, design &amp; more.
            Pay safely via escrow — released only on delivery.
          </p>

          {/* Search pill — full width on mobile, capped on larger screens */}
          <form
            onSubmit={handleHeroSearch}
            className="flex items-center mb-4 sm:mb-5 w-full sm:max-w-xs rounded-full overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.13)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
            }}
          >
            <div className="flex items-center gap-1.5 px-3 sm:px-4 shrink-0"
              style={{ borderRight: '1px solid rgba(255,255,255,0.14)' }}>
              <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
              <span className="hidden sm:block text-[10px] font-semibold whitespace-nowrap"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                Find a service
              </span>
            </div>
            <input
              id="hero-search-input"
              type="text"
              className="flex-1 py-2.5 sm:py-3 px-3 text-[11px] sm:text-xs font-medium bg-transparent border-none outline-none"
              style={{ color: '#fff' }}
              placeholder='e.g. "Python tutor", "logo design"…'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              id="hero-search-btn"
              aria-label="Search"
              className="m-1 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
              style={{
                width: 28, height: 28,
                background: 'linear-gradient(135deg,#635BFF,#A78BFA)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          </form>

          {/* CTAs + trust strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/signup"
              id="hero-cta-primary"
              className="inline-flex items-center gap-1.5 font-bold rounded-full text-white transition-all hover:-translate-y-0.5"
              style={{
                fontSize: 'clamp(0.68rem, 1.8vw, 0.78rem)',
                padding: 'clamp(7px,1.5vw,10px) clamp(14px,3vw,22px)',
                background: 'linear-gradient(135deg,#635BFF,#A78BFA)',
                boxShadow: '0 4px 14px rgba(99,91,255,0.4)',
                textDecoration: 'none',
              }}
            >
              Start for free <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/browse"
              id="hero-cta-secondary"
              className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
              style={{
                fontSize: 'clamp(0.68rem, 1.8vw, 0.78rem)',
                color: 'rgba(255,255,255,0.78)',
                textDecoration: 'none',
              }}
            >
              Browse services <ChevronRight className="w-3 h-3" />
            </Link>

            {/* Trust badges — only md+ */}
            <div className="hidden md:flex items-center gap-3 ml-1">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                <Shield className="w-2.5 h-2.5" style={{ color: '#A78BFA' }} />
                Stripe escrow
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                <Star className="w-2.5 h-2.5" style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                4.9 rating
              </span>
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>500+ students</span>
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS — Premium Razorpay-inspired Section === */}
      {!user && (
        <section id="how" className="py-28 relative overflow-hidden bg-[#0A0E27]" style={{ scrollMarginTop: '80px' }}>
          {/* Abstract Background Accents */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-stripe-purple/20 rounded-full blur-[150px] opacity-30 pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] opacity-40 pointer-events-none translate-y-1/2" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center md:text-left mb-16 fade-up">
              <p className="text-[#00D4FF] font-black text-sm uppercase tracking-[0.2em] mb-4 flex items-center justify-center md:justify-start gap-2">
                <Zap className="h-4 w-4" /> Seamless Experience
              </p>
              <h2 className="font-extrabold text-white text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 max-w-2xl" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Powering peer-to-peer campus services.
              </h2>
              <p className="text-[#8F9BB3] text-lg max-w-xl leading-relaxed">
                Experience a frictionless marketplace designed specifically for university ecosystems.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 items-center">
              {/* Steps List (Left Column) */}
              <div className="w-full lg:w-5/12 flex flex-col gap-2">
                {steps.map((step, i) => {
                  const isActive = activeStep === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`text-left p-6 rounded-2xl transition-all duration-500 relative overflow-hidden border ${isActive
                        ? 'bg-white/5 border-stripe-purple/30 shadow-[0_8px_32px_rgba(99,91,255,0.15)]'
                        : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-stripe-purple to-[#00D4FF] shadow-[0_0_15px_rgba(99,91,255,0.5)]" />
                      )}
                      <div className="flex items-start gap-5">
                        <div className={`mt-0.5 text-2xl font-display font-extrabold transition-colors duration-500 ${isActive ? 'text-[#00D4FF]' : 'text-white/20'
                          }`}>
                          {step.number}
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold mb-2 transition-colors duration-500 ${isActive ? 'text-white' : 'text-[#8F9BB3]'
                            }`}>
                            {step.title}
                          </h3>
                          <div className={`grid transition-all duration-500 ${isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <p className="overflow-hidden text-[#8F9BB3] leading-relaxed text-sm">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visualizer (Right Column) */}
              <div className="w-full lg:w-7/12 aspect-square md:aspect-video lg:aspect-square relative flex items-center justify-center">
                {/* Dynamic Mockup Container */}
                <div className="w-full max-w-lg relative z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  {activeStep === 0 && (
                    <div className="bg-[#11183C] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-in-up">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-stripe-purple to-[#00D4FF]" />
                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(99,91,255,0.2)]">
                          <Shield className="h-10 w-10 text-[#00D4FF]" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Verify Institutional Email</h4>
                          <p className="text-[#8F9BB3] text-sm">Waiting for .edu address confirmation</p>
                        </div>
                        <div className="w-full bg-[#0A0E27] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stripe-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-stripe-purple text-xs font-bold">@</span>
                          </div>
                          <div className="text-left flex-1">
                            <div className="text-white text-sm font-medium">student@university.edu</div>
                            <div className="text-green-400 text-xs flex items-center gap-1 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Verified successfully
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="relative animate-fade-in-up">
                      {/* Floating Cards */}
                      <div className="bg-[#11183C] p-5 rounded-2xl border border-white/10 shadow-2xl relative z-20 transform translate-x-6 -translate-y-4 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA878] to-[#046B4B] flex items-center justify-center shadow-lg pt-1 text-xl">💡</div>
                          <div>
                            <div className="w-32 h-2.5 bg-white/20 rounded-full mb-2" />
                            <div className="w-20 h-2 bg-white/10 rounded-full" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded bg-[#0EA878]/20 text-[#0EA878] text-[10px] font-bold border border-[#0EA878]/30">TUTORING</span>
                          <span className="px-2.5 py-1 rounded bg-white/5 text-white/50 text-[10px] font-bold border border-white/10">₹450/hr</span>
                        </div>
                      </div>

                      <div className="bg-[#0A0E27] p-5 rounded-2xl border border-white/10 shadow-2xl relative z-10 transform -translate-x-6 translate-y-4 opacity-80 scale-95">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F3EFF] to-[#2518B3] flex items-center justify-center shadow-lg text-white">
                            <Code className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="w-28 h-2.5 bg-white/20 rounded-full mb-2" />
                            <div className="w-24 h-2 bg-white/10 rounded-full" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded bg-[#4F3EFF]/20 text-[#4F3EFF] text-[10px] font-bold border border-[#4F3EFF]/30">CODING</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="bg-[#11183C] p-8 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden animate-fade-in-up">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00D4FF] via-transparent to-transparent pointer-events-none" />
                      <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                        <div className="relative">
                          <div className="w-24 h-24 bg-[#0A0E27] rounded-full flex items-center justify-center border-2 border-[#00D4FF]/30 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
                            <div className="w-16 h-16 bg-gradient-to-tr from-stripe-purple to-[#00D4FF] rounded-full flex items-center justify-center animate-[spin_4s_linear_infinite]">
                              <div className="w-14 h-14 bg-[#11183C] rounded-full flex items-center justify-center animate-[spin_4s_linear_infinite_reverse]">
                                <Shield className="h-6 w-6 text-[#00D4FF]" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full border border-white/10 flex items-center justify-center shadow-lg">
                            <span className="text-[#00D4FF] font-black text-xs">Escrow</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-bold text-xl mb-1">Funds Secured</h4>
                          <p className="text-[#8F9BB3] text-sm">Payment released only upon delivery</p>
                        </div>

                        {/* Fake Progress Bar */}
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#00D4FF]">Funded</span>
                            <span className="text-white/40">Delivered</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-gradient-to-r from-stripe-purple to-[#00D4FF] rounded-full relative">
                              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* === CATEGORIES === */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 fade-up">
            <div>
              <p className="text-stripe-purple font-semibold text-sm uppercase tracking-widest mb-3">All Skills Welcome</p>
              <h2 className="font-bold text-stripe-slate text-4xl lg:text-5xl" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Explore by category
              </h2>
            </div>
            <Link to="/browse" id="categories-browse-all" className="btn-ghost font-semibold text-stripe-purple shrink-0">
              View all services <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/browse?category=${encodeURIComponent(cat.name)}`}
                id={`cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="block rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm border border-white/80"
                style={{ background: cat.bg }}
              >
                {/* Coloured top strip */}
                <div className="h-1.5 w-full" style={{ background: cat.color }} />
                <div className="p-5">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: cat.color }}>
                      <cat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-[#0D1B2A] text-base mb-1 group-hover:opacity-80 transition-opacity">
                    {cat.name}
                  </h3>
                  <p className="text-[#425466] text-sm mb-3 leading-snug">{cat.desc}</p>
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: cat.color }}>
                    {cat.count}+ peers
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURED SERVICES (dummy data only) === */}
      <section className="bg-stripe-bg py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header row with arrows */}
          <div className="flex items-end justify-between mb-10 fade-up">
            <div className="text-center flex-1">
              <p className="text-stripe-purple font-semibold text-sm uppercase tracking-widest mb-3">Top Rated</p>
              <h2 className="font-display font-bold text-stripe-slate text-4xl lg:text-5xl mb-3">Featured services</h2>
              <p className="text-stripe-steel text-lg">Hand-picked, highest-rated services from your campus.</p>
            </div>
            {/* Arrow buttons */}
            <div className="flex gap-2 shrink-0 ml-4">
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-full border border-stripe-border bg-white shadow-sm flex items-center justify-center hover:border-stripe-purple hover:text-stripe-purple transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-full border border-stripe-border bg-white shadow-sm flex items-center justify-center hover:border-stripe-purple hover:text-stripe-purple transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal scroll carousel — dummy data only */}
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto pb-4 featured-carousel"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {MOCK_FEATURED.map((service, i) => {
              const color = catColor[service.category] || '#635BFF';
              const initials = getInitials(service);
              return (
                <Link
                  key={service._id || i}
                  to="/browse"
                  id={`featured-service-${service._id || i}`}
                  className="group block rounded-2xl bg-white overflow-hidden shrink-0 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    width: '300px',
                    scrollSnapAlign: 'start',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'}
                >
                  {/* Image area with inner padding */}
                  <div className="p-3 pb-0">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      {service.seller?.avatar ? (
                        <img
                          src={service.seller.avatar}
                          alt={service.seller.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: catBg[service.category] || 'linear-gradient(135deg,#EEF0FF,#DDE0FF)' }}>
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                            style={{ background: color }}>
                            {initials}
                          </div>
                        </div>
                      )}
                      {/* Category badge */}
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                        style={{ background: 'rgba(255,255,255,0.85)', color }}>
                        {service.category}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pt-4 pb-4">
                    {/* Seller name + verified badge */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-stripe-slate text-[15px] truncate">
                        {service.seller?.name || 'Student'}
                      </h3>
                      <BadgeCheck className="h-4.5 w-4.5 shrink-0" style={{ color: '#22c55e' }} />
                    </div>

                    {/* Service title as description */}
                    <p className="text-sm text-stripe-muted leading-snug line-clamp-2 mb-4" style={{ minHeight: '2.5rem' }}>
                      {service.title}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-between pt-3"
                      style={{ borderTop: '1px solid #F0F4F8' }}>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-stripe-muted">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-stripe-slate">{service.rating?.toFixed(1) || '5.0'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-stripe-muted">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          {service.reviewCount || 0}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: '#F6F9FC', color: '#0A2540' }}>
                        ₹{Number(service.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10 fade-up">
            <Link to="/browse" id="featured-browse-more" className="btn-primary">
              Browse marketplace <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === PLATFORM SERVICE SLIDER === */}
      <section className="py-12 bg-white overflow-hidden border-t border-stripe-border relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="text-center mb-8 fade-up">
          <p className="text-stripe-purple font-semibold text-sm uppercase tracking-widest mb-2">Explore the possibilities</p>
          <h3 className="font-display font-bold text-stripe-slate text-2xl">Trending Services on Cosen</h3>
        </div>

        <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex flex-1 justify-around gap-6 px-3">
              {[
                { name: 'App Development', icon: Code },
                { name: 'UI/UX Design', icon: Palette },
                { name: 'Calculus Tutoring', icon: BookOpen },
                { name: 'Data Analysis', icon: Database },
                { name: 'Resume Review', icon: PenTool },
                { name: 'Video Editing', icon: Zap },
                { name: 'Web Scraping', icon: Code },
                { name: 'Logo Animation', icon: Palette },
                { name: 'Guitar Lessons', icon: Music },
              ].map((service, j) => (
                <div key={j} className="flex items-center gap-3 bg-stripe-bg border border-stripe-border rounded-full py-3 px-6 shadow-sm hover:border-stripe-purple hover:shadow-md transition-all cursor-pointer group whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:text-stripe-purple transition-colors">
                    <service.icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-stripe-slate text-sm group-hover:text-stripe-purple transition-colors">{service.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-stripe-slate" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, #635BFF 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #00D4FF 0%, transparent 50%)'
        }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center fade-up">
          <h2 className="font-bold text-white text-4xl lg:text-5xl mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Ready to earn or hire on campus?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Join hundreds of verified students already earning money and getting help on Cosen.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup" id="cta-banner-join" className="bg-white text-stripe-purple hover:bg-stripe-bg font-bold px-8 py-4 rounded-md shadow-stripe-btn transition-all hover:-translate-y-0.5 inline-flex items-center gap-2">
              Join with your .edu email <ChevronRight className="h-5 w-5" />
            </Link>
            <Link to="/browse" id="cta-banner-browse" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-md transition-all">
              Browse first
            </Link>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-stripe-bg border-t border-stripe-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-stripe-muted font-sans font-normal text-sm">© 2025</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-stripe-steel">
            <Link to="/browse" className="hover:text-stripe-purple transition-colors">Browse</Link>
            <Link to="/services/new" className="hover:text-stripe-purple transition-colors">Post a Service</Link>
            <Link to="/signup" className="hover:text-stripe-purple transition-colors">Sign Up</Link>
            <Link to="/login" className="hover:text-stripe-purple transition-colors">Login</Link>
            <Link to="/dashboard" className="hover:text-stripe-purple transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
