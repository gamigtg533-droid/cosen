import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import {
  ChevronRight, ChevronLeft, Star, Shield, Zap, BookOpen,
  Code, Palette, UtensilsCrossed, Camera, Music, Search,
  ShieldCheck, BadgeCheck, ShoppingBag, Trophy, ArrowRight,
  Users, Lock, Sparkles, Mail, MessageCircle
} from 'lucide-react';
import LottieModule from 'lottie-react';
const Lottie = LottieModule.default || LottieModule;
import catLottie from '../assets/cat.json';
import playGameLottie from '../assets/play_game.json';
import heroBgVideo from '../assets/landing_page_back_video.mp4';
import person1 from '../assets/person1.jpg';
import person2 from '../assets/person2.jpg';
import person3 from '../assets/person3.jpg';
import person4 from '../assets/person4.jpg';
import person5 from '../assets/person5.jpg';
import person6 from '../assets/person6.jpg';

import imgTech from '../assets/hero_banner_images/Tech_help.png';
import imgSendiYou from '../assets/hero_banner_images/sendiyou.png';
import imgPlayground from '../assets/hero_banner_images/playground.png';
import imgStudy from '../assets/hero_banner_images/Study_helper.png';

const categories = [
  { name: 'Study Helper',     icon: BookOpen,        color: '#0EA878', count: 120, desc: 'Tutoring & exam prep' },
  { name: 'Tech & Coding',    icon: Code,            color: '#4F3EFF', count: 85,  desc: 'Websites, apps, scripts' },
  { name: 'Art & Design',     icon: Palette,         color: '#D63E82', count: 64,  desc: 'Logos, UI & illustrations' },
  { name: 'SendiYou',         icon: Zap,             color: '#EC4899', count: 215, desc: 'Anonymous matches & connections' },
  { name: 'Food Friendship',  icon: UtensilsCrossed, color: '#FF6348', count: 56,  desc: 'Home-cooked meals & snacks' },
  { name: 'Photography',      icon: Camera,          color: '#00B2FF', count: 41,  desc: 'Portraits, events & camera rental' },
  { name: 'Playground',       icon: Trophy,          color: '#F59E0B', count: 32,  desc: 'Team matches & esports pool' },
  { name: 'Other Talents',    icon: Music,           color: '#8B3FC9', count: 112, desc: 'Music, fitness, languages' },
];

const catColor = {
  'Tech & Coding': '#635BFF', 'Art & Design': '#FF6B9D', 'Study Helper': '#00D4AA',
  'SendiYou': '#EC4899',
  'Food Friendship': '#FF6348', 'Photography': '#00B2FF', 'Playground': '#F59E0B', 'Other Talents': '#A855F7',
};
const catBg = {
  'Tech & Coding':   'linear-gradient(135deg,#EEF0FF,#DDE0FF)',
  'Art & Design':    'linear-gradient(135deg,#FFF0F6,#FFE0ED)',
  'Study Helper':    'linear-gradient(135deg,#E8FFF8,#C8FFF0)',
  'SendiYou':        'linear-gradient(135deg,#FFF0F8,#FFE0F2)',
  'Food Friendship': 'linear-gradient(135deg,#FFF5F0,#FFE4D6)',
  'Photography':     'linear-gradient(135deg,#EAF8FF,#CBEFFF)',
  'Playground':      'linear-gradient(135deg,#FEF3C7,#FDE68A)',
  'Other Talents':   'linear-gradient(135deg,#F8F0FF,#EEDDFF)',
};

const MOCK_FEATURED = [
  { _id: '1', title: 'Python Debugging & Full CS Tutoring', description: 'Struggling with DSA, OOP, or Python assignments? I offer 1-on-1 sessions, assignment help, and project reviews.', seller: { name: 'Arjun Mehta', department: "Computer Science '25", avatar: person2 }, rating: 4.9, reviewCount: 28, price: 499, category: 'Tech & Coding', deliveryDays: 1, ordersCompleted: 43 },
  { _id: '2', title: 'Logo & Brand Identity Design for Your Club', description: 'Professional logo, color palette, and brand guide. Unlimited revisions in 48 hours. Guaranteed satisfaction.', seller: { name: 'Priya Patel', department: "Fine Arts '26", avatar: person1 }, rating: 5.0, reviewCount: 17, price: 599, category: 'Art & Design', deliveryDays: 2, ordersCompleted: 29 },
  { _id: '3', title: 'Calculus II & Linear Algebra Tutoring', description: 'Gold medallist in Engineering Mathematics. Covers limits, integrals, eigen values, and exam prep.', seller: { name: 'Rahul Sharma', department: "Mathematics '25", avatar: person3 }, rating: 4.8, reviewCount: 34, price: 449, category: 'Study Helper', deliveryDays: 1, ordersCompleted: 61 },
  { _id: '4', title: 'Homemade Rajma Chawal & Tiffin Service', description: 'Tired of mess food? I cook authentic home-style North Indian meals. Fresh, hygienic, delivered to your hostel.', seller: { name: 'Anjali Gupta', department: "Home Science '25", avatar: person4 }, rating: 4.9, reviewCount: 41, price: 80, category: 'Food Friendship', deliveryDays: 1, ordersCompleted: 78 },
  { _id: '5', title: 'Campus Portrait & Event Photography', description: 'Professional event, portfolio and portrait photography. High-res editing, raw files, and fast delivery.', seller: { name: 'Divya Nair', department: "Fine Arts '26", avatar: person5 }, rating: 4.9, reviewCount: 22, price: 999, category: 'Photography', deliveryDays: 2, ordersCompleted: 35 },
  { _id: '6', title: 'Acoustic Guitar Lessons: Beginner to Intermediate', description: 'Certified ABRSM Grade 6 guitarist. Chords, fingerpicking, strumming, song covers. Patient teaching style.', seller: { name: 'Meera Iyer', department: "Music '27", avatar: person6 }, rating: 5.0, reviewCount: 9, price: 299, category: 'Other Talents', deliveryDays: 1, ordersCompleted: 18 },
];

const steps = [
  { number: '01', title: 'Sign up with your campus email', desc: 'Instant verification. Only real students from your university. No outsiders, ever.' },
  { number: '02', title: 'Share what you need or offer', desc: 'Post a request, offer a skill, or send an anonymous connection. Every need has a match.' },
  { number: '03', title: "Connect, chat & transact safely", desc: "Message your match directly. Pay via escrow, money releases only when you're satisfied." },
];

const getInitials = (s) =>
  s.seller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
const getBg = (s) => catColor[s.category] || '#635BFF';

export default function Landing() {
  const heroRef    = useRef(null);
  const videoRef   = useRef(null);
  const navigate   = useNavigate();
  const carouselRef = useRef(null);
  const { user }   = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStep,  setActiveStep]  = useState(0);

  // Slow hero video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const setSpeed = () => { vid.playbackRate = 0.65; };
    vid.addEventListener('loadedmetadata', setSpeed);
    if (vid.readyState >= 1) setSpeed();
    return () => vid.removeEventListener('loadedmetadata', setSpeed);
  }, []);

  // Redirect logged-in users
  useEffect(() => {
    if (user) navigate('/browse', { replace: true });
  }, [user, navigate]);

  // Auto-cycle steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % steps.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Scroll-reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Mobile carousel auto-scroll
  useEffect(() => {
    let timer;
    const start = () => {
      if (window.innerWidth >= 768) return;
      timer = setInterval(() => {
        if (!carouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }, 2500);
    };
    start();
    const onResize = () => { clearInterval(timer); start(); };
    window.addEventListener('resize', onResize);
    return () => { clearInterval(timer); window.removeEventListener('resize', onResize); };
  }, []);

  const handleHeroSearch = e => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/browse?search=${encodeURIComponent(searchQuery.trim())}` : '/browse');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO — Fullscreen video, bottom-left content
      ═══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{ position:'relative', width:'100vw', marginLeft:'calc(50% - 50vw)', height:'100svh', minHeight:'100vh', overflow:'hidden' }}
      >
        <video
          ref={videoRef}
          src={heroBgVideo}
          autoPlay loop muted playsInline aria-hidden="true"
          style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%) scaleX(1.45) scaleY(1.18)', minWidth:'100%', minHeight:'100%', width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}
        />
        {/* Gradient overlay — strong at bottom, fades to transparent at top */}
        <div aria-hidden="true" style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(to top, rgba(6,8,24,0.96) 0%, rgba(6,8,24,0.70) 35%, rgba(6,8,24,0.25) 65%, transparent 100%)' }} />

        {/* Bottom-left content */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10, padding:'0 clamp(1.25rem,5vw,5rem) clamp(2rem,5vh,3.5rem)' }}>

          {/* Verified pill */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'100px', padding:'5px 14px', marginBottom:'1.25rem' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 8px rgba(52,211,153,0.6)', display:'inline-block', flexShrink:0 }} />
            <ShieldCheck style={{ width:12, height:12, color:'#34D399', flexShrink:0 }} />
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(255,255,255,0.85)' }}>100% Verified Students · Campus Only</span>
          </div>

          {/* Headline & Abstract Lottie */}
          <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '720px' }}>
            <h1 style={{ fontFamily:'Inter, sans-serif', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.04em', color:'#fff', fontSize:'clamp(2.8rem,8vw,6rem)', position: 'relative', zIndex: 10 }}>
              <span className="hero-word block" style={{ animationDelay: '0.1s' }}>Every student</span>
              <span className="hero-word block" style={{ animationDelay: '0.2s', color: 'rgba(255,255,255,0.7)' }}>has a <span style={{ color: '#fff' }}>need.</span></span>
              <span className="hero-word block" style={{ animationDelay: '0.3s' }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #00D4AA 0%, #635BFF 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  We find the match.
                </span>
              </span>
            </h1>
          </div>

          {/* Sub */}
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'clamp(0.95rem,2vw,1.1rem)', lineHeight:1.65, maxWidth:'480px', marginBottom:'1.75rem', fontWeight:400 }}>
            Skills, anonymous connections, group chats. One campus network for everything you need.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '380px', marginBottom: '1.25rem' }}>
            {/* Cat sleeping on search bar */}
            <div style={{ position: 'absolute', bottom: '100%', left: '30px', width: '95px', zIndex: 20, pointerEvents: 'none', marginBottom: '-5px' }}>
              <Lottie animationData={catLottie} loop={true} />
            </div>

            {/* Playing game on right side of search bar */}
            <div style={{ position: 'absolute', bottom: '100%', right: '15px', width: '70px', zIndex: 20, pointerEvents: 'none', marginBottom: '-2px' }}>
              <Lottie animationData={playGameLottie} loop={true} />
            </div>

            <form onSubmit={handleHeroSearch} style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.10)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.20)', borderRadius:'100px', overflow:'hidden' }}>
              <Search style={{ width:14, height:14, color:'rgba(255,255,255,0.45)', flexShrink:0, marginLeft:'1rem' }} />
              <input
                id="hero-search-input"
                type="text"
                placeholder='e.g. "Python tutor", "logo design"…'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:'12px', fontWeight:500, padding:'12px 12px' }}
              />
              <button type="submit" id="hero-search-btn" aria-label="Search" style={{ margin:'5px', background:'linear-gradient(135deg,#635BFF,#A78BFA)', border:'none', borderRadius:'100px', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'transform .15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ArrowRight style={{ width:14, height:14, color:'#fff' }} />
              </button>
            </form>
          </div>

          {/* CTAs */}
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'0.75rem' }}>
            <Link to="/signup" id="hero-cta-primary" style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#fff', color:'#0A0E27', fontWeight:700, fontSize:'13px', padding:'10px 22px', borderRadius:'100px', textDecoration:'none', transition:'all .2s', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0efff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Find your match <ArrowRight style={{ width:14, height:14 }} />
            </Link>
            <Link to="/browse" id="hero-cta-secondary" style={{ display:'inline-flex', alignItems:'center', gap:'4px', color:'rgba(255,255,255,0.72)', fontSize:'13px', fontWeight:500, textDecoration:'none', transition:'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Explore campus <ChevronRight style={{ width:14, height:14 }} />
            </Link>
            <div style={{ display:'none' }} className="md:flex items-center gap-4 ml-2">
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'11px', color:'rgba(255,255,255,0.45)', fontWeight:500 }}><Shield style={{ width:11, height:11, color:'#A78BFA' }} /> Escrow protected</span>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'11px', color:'rgba(255,255,255,0.45)', fontWeight:500 }}><Star style={{ width:11, height:11, color:'#FBBF24', fill:'#FBBF24' }} /> 4.9 rated</span>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', fontWeight:600 }}>500+ connected</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          VISION — Editorial split layout, no emoji boxes
      ═══════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════
          WHAT COSEN IS (BENTO GRID)
      ═══════════════════════════════════════════════════════ */}
      {!user && (
        <section className="bg-white py-24 border-t border-stripe-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="fade-up visible mb-16 max-w-3xl">
              <span className="text-sm font-medium text-stripe-purple block mb-3">What Cosen is</span>
              <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-slate-900 mb-5 leading-tight">
                We don't sell services. <span className="text-stripe-purple">We connect people.</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-sans">
                Cosen is a living campus network where every student is both a seeker and a provider. Tutoring, design, food, anonymous matches, group chats. One place for every campus need.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 1. Tech Help (Span 2) */}
              <div className="md:col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col sm:flex-row group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-md text-xs font-medium mb-5 w-fit">
                    Web • App • Debug
                  </div>
                  <h3 className="font-sans text-2xl font-semibold text-slate-900 mb-3 leading-snug">Code smarter. Build faster.</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed max-w-md font-sans">
                    Need a bug fixed or a complete application built? Connect with skilled campus developers for on-demand technical and data support.
                  </p>
                </div>
                <div className="flex-1 bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
                  <img src={imgTech} alt="Tech help" className="w-[110%] max-w-[320px] object-contain drop-shadow-xl group-hover:scale-[1.02] transition-transform duration-500 ease-out" />
                </div>
              </div>

              {/* 2. Anonymous connections (Span 1) */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-8 sm:p-8 pb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-md text-xs font-medium mb-5 w-fit">
                    SendiYou
                  </div>
                  <h3 className="font-sans text-xl font-semibold text-slate-900 mb-3 leading-snug">Connect. Share. Reveal. Safely.</h3>
                  <p className="text-slate-600 text-[14px] leading-relaxed mb-6 font-sans">
                    Reach out to a fellow student without showing your identity. Both parties choose if and when to reveal.
                  </p>
                </div>
                <div className="mt-auto bg-[#0F172A] flex items-end justify-center p-6 pt-0 relative overflow-hidden h-[180px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                  <img src={imgSendiYou} alt="SendiYou" className="absolute w-[120%] object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-500 ease-out z-0" />
                </div>
              </div>

              {/* 3. Groups for any reason (Span 1) */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="p-8 sm:p-8 pb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-md text-xs font-medium mb-5 w-fit">
                    Playground
                  </div>
                  <h3 className="font-sans text-xl font-semibold text-slate-900 mb-3 leading-snug">Challenge. Compete. Win.</h3>
                  <p className="text-slate-600 text-[14px] leading-relaxed mb-6 font-sans">
                    Looking for a gaming squad or a sports team? Organize tournaments and find teammates on campus.
                  </p>
                </div>
                <div className="mt-auto bg-[#0F172A] flex items-end justify-center p-6 pt-0 relative overflow-hidden h-[180px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                  <img src={imgPlayground} alt="Groups" className="absolute w-[140%] object-cover group-hover:-translate-y-1 transition-transform duration-500 ease-out z-0" />
                </div>
              </div>

              {/* 4. Study Helper (Span 2) */}
              <div className="md:col-span-2 lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col sm:flex-row-reverse group transition-all duration-300 shadow-lg relative hover:-translate-y-0.5">
                <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E293B] text-[#94A3B8] border border-[#334155] rounded-md text-xs font-medium mb-5 w-fit">
                    Study Helper
                  </div>
                  <h3 className="font-sans text-2xl sm:text-3xl font-semibold text-white mb-4 leading-snug">
                    Peer tutoring. Campus rates. Real results.
                  </h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm font-sans">
                    Struggling with a tough assignment? Find verified student tutors who have already aced the course.
                  </p>
                </div>
                <div className="flex-1 bg-[#020617] flex items-center justify-center relative z-10 overflow-hidden">
                  <img src={imgStudy} alt="Study Helper" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-[1.02] group-hover:opacity-90 transition-all duration-500 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-transparent to-transparent hidden sm:block"></div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES — Minimal list layout, not icon boxes
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background:'#F8FAFC', padding:'6rem clamp(1.5rem,6vw,5rem)' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'3rem', gap:'1rem' }} className="fade-up">
            <div>
              <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#635BFF', display:'block', marginBottom:'0.75rem' }}>Every kind of need</span>
              <h2 style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:900, color:'#060C20', margin:0, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Find your kind of student
              </h2>
            </div>
            <Link to="/browse" id="categories-browse-all" style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#635BFF', fontSize:'13px', fontWeight:600, textDecoration:'none', flexShrink:0, whiteSpace:'nowrap', borderBottom:'1px solid transparent', transition:'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#635BFF'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              Browse all <ChevronRight style={{ width:14, height:14 }} />
            </Link>
          </div>

          {/* Category grid — 2+2+2+1 editorial style */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1px', background:'#E2E8F0', borderRadius:'1rem', overflow:'hidden' }} className="fade-up">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/browse?category=${encodeURIComponent(cat.name)}`}
                id={`cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ background:'#fff', display:'flex', alignItems:'center', gap:'1.25rem', padding:'1.5rem 1.75rem', textDecoration:'none', transition:'all .2s', position:'relative' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFF'; e.currentTarget.querySelector('.cat-arrow').style.opacity = '1'; e.currentTarget.querySelector('.cat-arrow').style.transform = 'translateX(0)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.querySelector('.cat-arrow').style.opacity = '0'; e.currentTarget.querySelector('.cat-arrow').style.transform = 'translateX(-6px)'; }}
              >
                <div style={{ width:44, height:44, borderRadius:'12px', background:`${cat.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${cat.color}25` }}>
                  <cat.icon style={{ width:20, height:20, color: cat.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'15px', color:'#0F172A', marginBottom:'2px' }}>{cat.name}</div>
                  <div style={{ fontSize:'12px', color:'#94A3B8' }}>{cat.desc}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:'11px', fontWeight:600, color:cat.color, background:`${cat.color}12`, padding:'2px 10px', borderRadius:'100px' }}>{cat.count}+</span>
                  <ArrowRight className="cat-arrow" style={{ width:14, height:14, color:'#635BFF', opacity:0, transform:'translateX(-6px)', transition:'all .2s' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — Clean dark section, no blobs
      ═══════════════════════════════════════════════════════ */}
      {!user && (
        <section id="how" style={{ background:'#060C20', padding:'7rem clamp(1.5rem,6vw,5rem)', scrollMarginTop:'80px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'start' }} id="how-grid">
              {/* Left: heading */}
              <div>
                <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#635BFF', display:'block', marginBottom:'1.5rem' }}>How it works</span>
                <h2 style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:'-0.03em', margin:'0 0 1.5rem' }}>
                  From need to<br />connection<br />
                  <span style={{ color:'#635BFF' }}>in minutes.</span>
                </h2>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'1rem', lineHeight:1.7, margin:'0 0 2.5rem', maxWidth:'380px' }}>
                  Whether you need a tutor, a campus friend, or a group for your next tournament, Cosen finds your match.
                </p>
                <Link to="/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#635BFF', color:'#fff', fontWeight:600, fontSize:'13px', padding:'11px 24px', borderRadius:'100px', textDecoration:'none', transition:'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#4F3EFF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#635BFF'}
                >
                  Get started free <ArrowRight style={{ width:14, height:14 }} />
                </Link>
              </div>

              {/* Right: steps */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0', paddingTop:'0.5rem' }}>
                {steps.map((step, i) => {
                  const isActive = activeStep === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      style={{ textAlign:'left', padding:'1.75rem 1.5rem', borderRadius:'0.875rem', background: isActive ? 'rgba(99,91,255,0.10)' : 'transparent', border: isActive ? '1px solid rgba(99,91,255,0.25)' : '1px solid transparent', cursor:'pointer', transition:'all .4s', marginBottom:'0.5rem', position:'relative' }}
                    >
                      {isActive && <div style={{ position:'absolute', left:0, top:'15%', bottom:'15%', width:3, borderRadius:3, background:'#635BFF', boxShadow:'0 0 12px rgba(99,91,255,0.6)' }} />}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem' }}>
                        <span style={{ fontFamily:'Inter, sans-serif', fontSize:'1.5rem', fontWeight:900, color: isActive ? '#635BFF' : 'rgba(255,255,255,0.15)', lineHeight:1, flexShrink:0, transition:'color .4s', letterSpacing:'-0.04em' }}>{step.number}</span>
                        <div>
                          <h3 style={{ fontSize:'1rem', fontWeight:700, color: isActive ? '#fff' : 'rgba(255,255,255,0.45)', margin:'0 0 0.5rem', transition:'color .4s', letterSpacing:'-0.01em' }}>{step.title}</h3>
                          <div style={{ overflow:'hidden', maxHeight: isActive ? '80px' : '0', opacity: isActive ? 1 : 0, transition:'max-height .4s, opacity .4s' }}>
                            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.50)', lineHeight:1.65, margin:0 }}>{step.desc}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SENDIYOU — Minimal, editorial dark feature section
      ═══════════════════════════════════════════════════════ */}
      {!user && (
        <section style={{ background:'#fff', padding:'7rem clamp(1.5rem,6vw,5rem)', borderTop:'1px solid #F1F5F9' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

            {/* Top label */}
            <div className="fade-up" style={{ marginBottom:'4rem' }}>
              <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#EC4899', display:'block', marginBottom:'0.75rem' }}>Beyond a marketplace</span>
              <h2 style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(1.8rem,3.5vw,3rem)', fontWeight:900, color:'#060C20', margin:0, letterSpacing:'-0.03em', lineHeight:1.1, maxWidth:'600px' }}>
                Connections that go{' '}
                <span style={{ fontFamily:"'Playwrite MX Guides', cursive", fontWeight:400, color:'#EC4899' }}>beyond</span>{' '}
                transactions
              </h2>
            </div>

            {/* Three feature panels — horizontal layout, not card grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'2px', borderRadius:'1.25rem', overflow:'hidden', border:'1px solid #F1F5F9', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }} className="fade-up sendiyou-grid">
              {[
                {
                  accent: '#635BFF',
                  icon: <Code style={{ width:20, height:20, color:'#635BFF' }} />,
                  title: 'Skill Connections',
                  body: 'Post what you need, someone on campus can do it. Tutoring, design, code, food, events.',
                  tags: ['Tutoring', 'Coding', 'Design', 'Photography'],
                  link: '/browse',
                },
                {
                  accent: '#EC4899',
                  icon: <Lock style={{ width:20, height:20, color:'#EC4899' }} />,
                  title: 'SendiYou: Anonymous',
                  body: 'Connect with a student anonymously. Reveal your identity only when you both agree. Campus-safe, consent-first.',
                  tags: ['Anonymous', 'Gender filter', '7-day chat'],
                  link: '/signup',
                  featured: true,
                },
                {
                  accent: '#F59E0B',
                  icon: <Users style={{ width:20, height:20, color:'#F59E0B' }} />,
                  title: 'Group Connections',
                  body: 'One post, up to 50 students. Group study, cricket team, club event all in a shared chat.',
                  tags: ['Sports', 'Study groups', 'Club events'],
                  link: '/browse',
                },
              ].map((panel, i) => (
                <div key={i} style={{ background: panel.featured ? '#060C20' : '#fff', padding:'2.5rem 2rem', position:'relative', transition:'background .3s' }}
                  onMouseEnter={e => { if (!panel.featured) e.currentTarget.style.background = '#FAFBFF'; }}
                  onMouseLeave={e => { if (!panel.featured) e.currentTarget.style.background = '#fff'; }}
                >
                  {panel.featured && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, #635BFF, #EC4899)' }} />}
                  <div style={{ width:40, height:40, borderRadius:10, background:`${panel.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem', border:`1px solid ${panel.accent}25` }}>
                    {panel.icon}
                  </div>
                  <h3 style={{ fontSize:'1.05rem', fontWeight:700, color: panel.featured ? '#fff' : '#0F172A', margin:'0 0 0.75rem', letterSpacing:'-0.01em' }}>
                    {panel.title}
                    {panel.featured && <span style={{ fontSize:'10px', fontWeight:700, background:'#EC4899', color:'#fff', padding:'2px 8px', borderRadius:'100px', marginLeft:'0.5rem', verticalAlign:'middle', letterSpacing:'0.05em' }}>UNIQUE</span>}
                  </h3>
                  <p style={{ fontSize:'13.5px', color: panel.featured ? 'rgba(255,255,255,0.55)' : '#64748B', lineHeight:1.7, margin:'0 0 1.5rem' }}>{panel.body}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {panel.tags.map(t => (
                      <span key={t} style={{ fontSize:'11px', fontWeight:600, color: panel.featured ? 'rgba(255,255,255,0.6)' : panel.accent, background: panel.featured ? 'rgba(255,255,255,0.08)' : `${panel.accent}12`, padding:'3px 10px', borderRadius:'100px', border: panel.featured ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${panel.accent}25` }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="fade-up" style={{ marginTop:'2.5rem', textAlign:'center' }}>
              <Link to="/signup" id="sendiyou-cta" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#060C20', color:'#fff', fontWeight:600, fontSize:'13px', padding:'12px 28px', borderRadius:'100px', textDecoration:'none', transition:'background .2s', boxShadow:'0 4px 16px rgba(6,12,32,0.15)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1060'}
                onMouseLeave={e => e.currentTarget.style.background = '#060C20'}
              >
                Start connecting on campus <ArrowRight style={{ width:14, height:14 }} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURED SERVICES — Clean card carousel
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background:'#F8FAFC', padding:'6rem clamp(1.5rem,6vw,5rem)' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'2.5rem', gap:'1rem' }} className="fade-up">
            <div>
              <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#635BFF', display:'block', marginBottom:'0.75rem' }}>Real students, real skills</span>
              <h2 style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(1.8rem,3vw,2.5rem)', fontWeight:900, color:'#060C20', margin:0, letterSpacing:'-0.03em' }}>Top student connections</h2>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <button onClick={() => carouselRef.current?.scrollBy({ left:-320, behavior:'smooth' })} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .2s' }} aria-label="Scroll left"
                onMouseEnter={e => { e.currentTarget.style.borderColor='#635BFF'; e.currentTarget.style.color='#635BFF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.color='inherit'; }}
              ><ChevronLeft style={{ width:16, height:16 }} /></button>
              <button onClick={() => carouselRef.current?.scrollBy({ left:320, behavior:'smooth' })} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .2s' }} aria-label="Scroll right"
                onMouseEnter={e => { e.currentTarget.style.borderColor='#635BFF'; e.currentTarget.style.color='#635BFF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.color='inherit'; }}
              ><ChevronRight style={{ width:16, height:16 }} /></button>
            </div>
          </div>

          <div ref={carouselRef} style={{ display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'0.5rem', scrollSnapType:'x mandatory', scrollbarWidth:'none' }} className="featured-carousel">
            {MOCK_FEATURED.map((service, i) => {
              const color = catColor[service.category] || '#635BFF';
              return (
                <Link
                  key={service._id || i}
                  to="/browse"
                  id={`featured-service-${service._id || i}`}
                  style={{ background:'#fff', borderRadius:'1rem', overflow:'hidden', flexShrink:0, width:'280px', scrollSnapAlign:'start', textDecoration:'none', display:'flex', flexDirection:'column', border:'1px solid #F1F5F9', transition:'all .25s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Image */}
                  <div style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden' }}>
                    {service.seller?.avatar ? (
                      <img src={service.seller.avatar} alt={service.seller.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block', transition:'transform .4s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ) : (
                      <div style={{ width:'100%', height:'100%', background:catBg[service.category], display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:52, height:52, borderRadius:14, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'18px' }}>{getInitials(service)}</div>
                      </div>
                    )}
                    <span style={{ position:'absolute', top:10, left:10, fontSize:'10px', fontWeight:700, color, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(8px)', padding:'3px 10px', borderRadius:'100px', letterSpacing:'0.04em' }}>{service.category}</span>
                  </div>
                  {/* Body */}
                  <div style={{ padding:'1rem 1.1rem 1.1rem', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <span style={{ fontSize:'14px', fontWeight:700, color:'#0F172A', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{service.seller?.name}</span>
                      <BadgeCheck style={{ width:15, height:15, color:'#22C55E', flexShrink:0 }} />
                    </div>
                    <p style={{ fontSize:'12.5px', color:'#64748B', lineHeight:1.55, margin:'0 0 auto', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{service.title}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'0.875rem', paddingTop:'0.875rem', borderTop:'1px solid #F1F5F9' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'12px' }}>
                          <Star style={{ width:12, height:12, color:'#FBBF24', fill:'#FBBF24' }} />
                          <span style={{ fontWeight:700, color:'#0F172A' }}>{service.rating?.toFixed(1)}</span>
                        </span>
                        <span style={{ fontSize:'11px', color:'#94A3B8' }}>{service.reviewCount} reviews</span>
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:700, color:'#0F172A' }}>₹{Number(service.price).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="fade-up" style={{ textAlign:'center', marginTop:'2.5rem' }}>
            <Link to="/browse" id="featured-browse-more" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#635BFF', fontWeight:600, fontSize:'13px', textDecoration:'none', borderBottom:'1px solid transparent', transition:'border-color .2s', paddingBottom:2 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#635BFF'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              Browse all student connections <ChevronRight style={{ width:14, height:14 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          MARQUEE SLIDER
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'3rem 0', borderTop:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', inset:'0 0 0 0', background:'linear-gradient(to right, #fff 0%, transparent 10%, transparent 90%, #fff 100%)', zIndex:10, pointerEvents:'none' }} />
        <div style={{ display:'flex', width:'200%', animation:'marquee 28s linear infinite' }} className="hover:[animation-play-state:paused]">
          {[0,1].map(k => (
            <div key={k} style={{ display:'flex', flex:1, justifyContent:'space-around', gap:'1rem', padding:'0 0.5rem' }}>
              {[
                { name:'App Development', icon:Code },
                { name:'UI/UX Design', icon:Palette },
                { name:'Calculus Tutoring', icon:BookOpen },
                { name:'Portrait Shoot', icon:Camera },
                { name:'Homemade Tiffin', icon:UtensilsCrossed },
                { name:'Anonymous Match 💌', icon:Zap },
                { name:'Cricket Group 🏏', icon:Trophy },
                { name:'Logo Animation', icon:Palette },
                { name:'Guitar Lessons', icon:Music },
                { name:'Study Partner 📚', icon:BookOpen },
              ].map((s, j) => (
                <div key={j} style={{ display:'flex', alignItems:'center', gap:10, background:'#F8FAFC', border:'1px solid #F1F5F9', borderRadius:'100px', padding:'10px 18px', whiteSpace:'nowrap', cursor:'pointer', transition:'all .2s', flexShrink:0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#635BFF'; e.currentTarget.style.background='#F0EFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#F1F5F9'; e.currentTarget.style.background='#F8FAFC'; }}
                >
                  <s.icon style={{ width:14, height:14, color:'#635BFF', flexShrink:0 }} />
                  <span style={{ fontSize:'13px', fontWeight:600, color:'#334155' }}>{s.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER — Clean, no gradients overload
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background:'#060C20', padding:'7rem clamp(1.5rem,6vw,5rem)' }}>
        <div style={{ maxWidth:'780px', margin:'0 auto', textAlign:'center' }} className="fade-up">
          <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', display:'block', marginBottom:'1.5rem' }}>Join your campus network</span>
          <h2 style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:'-0.03em', margin:'0 0 1.25rem' }}>
            Your next connection<br />is already on campus.
          </h2>
          <p style={{ color:'#828F9E', fontSize:'clamp(1rem,2vw,1.1rem)', maxWidth:'600px', margin:'0 auto 2.5rem', lineHeight:1.7 }}>
            Hundreds of students are sharing skills, finding matches, and building connections on Cosen right now.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:'2.5rem' }}>
            <Link to="/signup" id="cta-banner-join" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#635BFF', color:'#fff', fontWeight:700, fontSize:'14px', padding:'13px 28px', borderRadius:'100px', textDecoration:'none', transition:'background .2s', boxShadow:'0 4px 20px rgba(99,91,255,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#4F3EFF'}
              onMouseLeave={e => e.currentTarget.style.background = '#635BFF'}
            >
              Join free with .edu email <ArrowRight style={{ width:16, height:16 }} />
            </Link>
            <Link to="/browse" id="cta-banner-browse" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.75)', fontWeight:600, fontSize:'14px', padding:'13px 28px', borderRadius:'100px', textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
            >
              Explore connections
            </Link>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'0.5rem 2rem' }}>
            {['100% student-verified', 'Anonymous connections', 'Group & 1-on-1 chats', 'Escrow-protected'].map(item => (
              <span key={item} style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', fontWeight:500 }}>✓ {item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <Footer />

      {/* Responsive helper styles */}
      <style>{`
        @media (max-width: 768px) {
          .vision-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .vision-row { grid-template-columns: 60px 1fr !important; gap: 1rem !important; }
          .vision-row > *:last-child { grid-column: 2 !important; }
          #how-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .sendiyou-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .vision-row { grid-template-columns: 1fr !important; }
          .vision-row span:first-child { display: none !important; }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
