import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Menu, X, BookOpen, Code, Palette, UtensilsCrossed,
  Camera, Music, LayoutDashboard, Search, LogIn, LogOut, User as UserIcon,
  MessageCircle, PlusSquare, Bell, Trophy, Heart
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import BrandLogo from './BrandLogo';
import api from '../lib/api';

const navLinks = [
  { label: 'Browse', href: '/browse' },
  { label: 'How It Works', href: '/#how' },
];

const categories = [
  { name: 'Study Helper',    icon: BookOpen, color: '#00D4AA', desc: 'Tutoring & exam prep' },
  { name: 'Tech & Coding',   icon: Code,     color: '#635BFF', desc: 'Websites, apps, scripts' },
  { name: 'Art & Design',    icon: Palette,  color: '#FF6B9D', desc: 'Logos, UI & illustrations' },
  { name: 'Food Friendship',  icon: UtensilsCrossed, color: '#FF6348', desc: 'Home-cooked meals & snacks' },
  { name: 'Photography',     icon: Camera,   color: '#00B2FF', desc: 'Portraits, events & camera rental' },
  { name: 'Playground',      icon: Trophy,   color: '#F59E0B', desc: 'Team matches & esports pool' },
  { name: 'SendiYou',        icon: Heart,    color: '#EC4899', desc: 'Anonymous campus connections' },
  { name: 'Other Talents',   icon: Music,    color: '#A855F7', desc: 'Music, fitness, languages' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Navbar is transparent only on the landing page hero (top of page)
  const isOnHero = location.pathname === '/' && !scrolled;

  const { user, logout } = useAuthStore();
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Poll unread DM count every 30s
  useEffect(() => {
    if (!user) { setUnreadDMs(0); return; }
    const fetch = async () => {
      try {
        const { data } = await api.get('/conversations/unread-count');
        setUnreadDMs(data.count || 0);
      } catch { /* ignore */ }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Poll notification count every 30s
  useEffect(() => {
    if (!user) { setUnreadNotifs(0); setNotifications([]); return; }
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications/count');
        setUnreadNotifs(data.unread || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Fetch full notifications when bell is opened
  const openBell = async () => {
    setBellOpen(prev => !prev);
    if (!bellOpen) {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications || []);
      } catch { /* ignore */ }
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
    } catch { /* ignore */ }
  };

  const clearAllNotifs = async () => {
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setUnreadNotifs(0);
      setBellOpen(false);
    } catch { /* ignore */ }
  };

  const handleNotifClick = (notif) => {
    // Fire-and-forget API call to prevent blocking UI
    api.patch(`/notifications/${notif.id}/read`).catch(() => {});
    
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadNotifs(prev => Math.max(0, prev - (notif.is_read ? 0 : 1)));
    
    // Defer closing the menu so that React Router <Link> can process the navigation event first
    setTimeout(() => {
      setBellOpen(false);
    }, 150);
  };

  // Close bell on outside click
  useEffect(() => {
    const handler = (e) => { 
      const clickedDesktopBell = bellRef.current && bellRef.current.contains(e.target);
      const clickedMobileBell = e.target.closest('#mobile-nav-bell');
      const clickedMobileSheet = e.target.closest('#mobile-bell-sheet');
      
      if (!clickedDesktopBell && !clickedMobileBell && !clickedMobileSheet) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const notifIcon = (type) => {
    if (type === 'order_placed')    return '🛒';
    if (type === 'order_delivered') return '📦';
    if (type === 'order_completed') return '✅';
    if (type === 'order_disputed')  return '⚠️';
    if (type === 'review_received') return '⭐';
    return '🔔';
  };

  // Hide 'How It Works' for logged-in users — they already know the flow
  const visibleLinks = user
    ? navLinks.filter(link => link.label !== 'How It Works')
    : navLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setCategoriesOpen(false); setUserMenuOpen(false); setBellOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  // Get user initials for avatar
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <nav
        id="main-navbar"
        className="fixed w-full z-50 transition-all duration-500"
        style={{
          backgroundColor: isOnHero ? 'transparent' : (scrolled ? 'rgba(255,255,255,0.94)' : '#ffffff'),
          backdropFilter: isOnHero ? 'none' : (scrolled ? 'blur(18px)' : 'none'),
          WebkitBackdropFilter: isOnHero ? 'none' : (scrolled ? 'blur(18px)' : 'none'),
          borderBottom: isOnHero ? '1px solid rgba(255,255,255,0.10)' : '1px solid #E6EBF1',
          boxShadow: scrolled ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <BrandLogo size="md" variant={isOnHero ? 'light' : 'dark'} />

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {/* Categories Mega Dropdown */}
              <div className="relative" onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
                <button
                  id="nav-categories-toggle"
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: isOnHero
                      ? 'rgba(255,255,255,0.88)'
                      : (categoriesOpen ? '#635BFF' : '#425466'),
                    background: categoriesOpen && !isOnHero ? '#635BFF0D' : 'transparent',
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}
                >
                  Categories
                  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoriesOpen && (
                  <div
                    id="nav-categories-dropdown"
                    className="absolute top-full left-0 mt-1 rounded-2xl p-4 grid grid-cols-2 gap-2"
                    style={{ width: '420px', background: '#fff', border: '1px solid #E6EBF1', boxShadow: '0 30px 60px -12px rgba(50,50,93,0.25), 0 18px 36px -18px rgba(0,0,0,0.15)' }}
                  >
                    {categories.map((cat, i) => (
                      <Link
                        key={i}
                        to={`/browse?category=${encodeURIComponent(cat.name)}`}
                        id={`nav-cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F6F9FC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}18` }}>
                          <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: '#0A2540', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{cat.name}</div>
                          <div className="text-xs" style={{ color: '#8792A2' }}>{cat.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {visibleLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: isOnHero
                      ? 'rgba(255,255,255,0.88)'
                      : (location.pathname === link.href ? '#635BFF' : '#425466'),
                    background: !isOnHero && location.pathname === link.href ? '#635BFF0D' : 'transparent',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to="/dashboard"
                id="nav-dashboard"
                className="px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5"
                style={{
                  color: isOnHero
                    ? 'rgba(255,255,255,0.88)'
                    : (location.pathname === '/dashboard' ? '#635BFF' : '#425466'),
                  background: !isOnHero && location.pathname === '/dashboard' ? '#635BFF0D' : 'transparent',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </div>

            {/* ── Desktop Auth ── */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Messages icon with badge */}
              {user && (
                <>
                  <Link
                    to="/messages"
                    id="nav-messages"
                    className="relative p-2 rounded-lg transition-colors"
                    style={{ color: location.pathname === '/messages' ? '#635BFF' : '#425466' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F6F9FC'; e.currentTarget.style.color = '#635BFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = location.pathname === '/messages' ? '#635BFF' : '#425466'; }}
                    title="Messages"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {unreadDMs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-stripe-purple text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadDMs > 9 ? '9+' : unreadDMs}
                      </span>
                    )}
                  </Link>

                  {/* Notification Bell */}
                  <div className="relative" ref={bellRef}>
                    <button
                      id="nav-bell"
                      onClick={openBell}
                      className="relative p-2 rounded-lg transition-colors"
                      style={{ color: bellOpen ? '#635BFF' : '#425466', background: bellOpen ? '#F6F9FC' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F6F9FC'; e.currentTarget.style.color = '#635BFF'; }}
                      onMouseLeave={e => { if (!bellOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#425466'; } }}
                      title="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadNotifs > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {unreadNotifs > 9 ? '9+' : unreadNotifs}
                        </span>
                      )}
                    </button>
                    {bellOpen && (
                      <div
                        className="absolute top-full right-0 mt-2 rounded-2xl overflow-hidden"
                        style={{ width: '340px', background: '#fff', border: '1px solid #E6EBF1', boxShadow: '0 20px 40px -8px rgba(50,50,93,0.18)', zIndex: 60 }}
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E6EBF1' }}>
                          <span className="font-bold text-stripe-slate text-sm">Notifications</span>
                          <div className="flex gap-3">
                            {unreadNotifs > 0 && (
                              <button onClick={markAllRead} className="text-xs font-semibold text-stripe-purple hover:underline">Mark all read</button>
                            )}
                            {notifications.length > 0 && (
                              <button onClick={clearAllNotifs} className="text-xs font-semibold text-red-500 hover:underline">Clear all</button>
                            )}
                          </div>
                        </div>
                        <div className="overflow-y-auto divide-y" style={{ maxHeight: '60vh', borderColor: '#F6F9FC' }}>
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <Bell className="h-8 w-8 text-stripe-muted opacity-30 mb-2" />
                              <p className="text-sm text-stripe-muted">No notifications yet</p>
                              <p className="text-xs text-stripe-muted mt-1">Order updates & reviews appear here</p>
                            </div>
                          ) : (
                            notifications.map(n => {
                              const NotifWrapper = n.link ? Link : 'button';
                              return (
                                <NotifWrapper
                                  key={n.id}
                                  to={n.link || undefined}
                                  onClick={() => handleNotifClick(n)}
                                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stripe-bg"
                                  style={{ background: n.is_read ? '#fff' : '#635BFF08', textDecoration: 'none' }}
                                >
                                  <span className="text-lg shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm leading-snug ${n.is_read ? 'text-stripe-steel font-medium' : 'text-stripe-slate font-bold'}`}>
                                      {n.title}
                                    </div>
                                    <div className="text-xs text-stripe-muted mt-0.5 line-clamp-2">{n.body}</div>
                                    <div className="text-[10px] text-stripe-muted mt-1">{timeAgo(n.created_at)}</div>
                                  </div>
                                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-stripe-purple shrink-0 mt-1.5" />}
                                </NotifWrapper>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Link
                to="/browse"
                id="nav-search-icon"
                className="p-2 rounded-lg transition-colors"
                style={{ color: isOnHero ? 'rgba(255,255,255,0.80)' : '#425466' }}
                onMouseEnter={e => { e.currentTarget.style.background = isOnHero ? 'rgba(255,255,255,0.12)' : '#F6F9FC'; e.currentTarget.style.color = isOnHero ? '#fff' : '#0A2540'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isOnHero ? 'rgba(255,255,255,0.80)' : '#425466'; }}
                title="Search services"
              >
                <Search className="h-4 w-4" />
              </Link>

              {user ? (
                /* Logged-in: Avatar + dropdown */
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="nav-user-avatar"
                    onClick={() => setUserMenuOpen(prev => !prev)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all"
                    style={{ border: '1px solid #E6EBF1', background: userMenuOpen ? '#F6F9FC' : '#fff' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: '#635BFF' }}>
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-stripe-slate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {user.name?.split(' ')[0]}
                    </span>
                    <svg className={`h-3.5 w-3.5 text-stripe-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 rounded-xl overflow-hidden"
                      style={{ background: '#fff', border: '1px solid #E6EBF1', boxShadow: '0 20px 40px -8px rgba(50,50,93,0.15)' }}>
                      {/* User info */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: '#E6EBF1' }}>
                        <div className="text-sm font-semibold text-stripe-slate">{user.name}</div>
                        <div className="text-xs text-stripe-muted truncate">{user.email}</div>
                        {user.department && <div className="text-xs text-stripe-muted">{user.department}</div>}
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-stripe-slate hover:bg-stripe-bg transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-stripe-purple" /> Dashboard
                      </Link>
                      <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-stripe-slate hover:bg-stripe-bg transition-colors">
                        <UserIcon className="h-4 w-4 text-stripe-purple" /> My Profile
                      </Link>
                      <Link to="/messages" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-stripe-slate hover:bg-stripe-bg transition-colors">
                        <MessageCircle className="h-4 w-4 text-stripe-purple" />
                        Messages
                        {unreadDMs > 0 && (
                          <span className="ml-auto w-5 h-5 rounded-full bg-stripe-purple text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadDMs}
                          </span>
                        )}
                      </Link>
                      <div style={{ borderTop: '1px solid #E6EBF1' }}>
                        <button
                          id="nav-logout"
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged-out: Sign in + CTA */
                <>
                  <Link
                    to="/login"
                    id="nav-signin"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all border"
                    style={{
                      color: isOnHero ? 'rgba(255,255,255,0.88)' : '#0A2540',
                      border: isOnHero ? '1px solid rgba(255,255,255,0.30)' : '1px solid #E6EBF1',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#635BFF'; e.currentTarget.style.color = '#635BFF'; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isOnHero ? 'rgba(255,255,255,0.30)' : '#E6EBF1';
                      e.currentTarget.style.color = isOnHero ? 'rgba(255,255,255,0.88)' : '#0A2540';
                    }}
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign in
                  </Link>
                  <Link to="/signup" id="nav-cta" className="btn-primary text-sm py-2 px-5">
                    Start for free <ChevronRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              id="nav-mobile-toggle"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ color: '#0A2540' }}
              onClick={() => setMobileOpen(prev => !prev)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(10,37,64,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        id="nav-mobile-drawer"
        className="fixed top-0 right-0 h-full z-50 md:hidden overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{
          width: 'min(320px, 88vw)',
          background: '#fff',
          boxShadow: '-8px 0 32px rgba(10,37,64,0.15)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: '#E6EBF1' }}>
          <BrandLogo size="sm" onClick={() => setMobileOpen(false)} />
          <button id="nav-mobile-close" onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#425466' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logged-in user info strip */}
        {user && (
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: '#F6F9FC', borderColor: '#E6EBF1' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: '#635BFF' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-stripe-slate truncate">{user.name}</div>
              <div className="text-xs text-stripe-muted truncate">{user.department || user.email}</div>
            </div>
          </div>
        )}

        <div className="p-5 flex flex-col gap-1">
          <Link to="/browse" id="mobile-nav-search" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm"
            style={{ color: '#425466', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F6F9FC'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Search className="h-4 w-4" style={{ color: '#635BFF' }} /> Search services
          </Link>

          {visibleLinks.map(link => (
            <Link key={link.href} to={link.href} id={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-3 py-3 rounded-xl font-semibold text-sm"
              style={{ color: location.pathname === link.href ? '#635BFF' : '#425466', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {link.label}
            </Link>
          ))}

          <Link to="/dashboard" id="mobile-nav-dashboard" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm"
            style={{ color: location.pathname === '/dashboard' ? '#635BFF' : '#425466', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>

          <Link to="/messages" id="mobile-nav-messages" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm"
            style={{ color: location.pathname === '/messages' ? '#635BFF' : '#425466', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="relative">
              <MessageCircle className="h-4 w-4" />
              {unreadDMs > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-stripe-purple text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadDMs}
                </span>
              )}
            </span>
            Messages
          </Link>

          <Link to="/profile" id="mobile-nav-profile" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm"
            style={{ color: location.pathname === '/profile' ? '#635BFF' : '#425466', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <UserIcon className="h-4 w-4" /> My Profile
          </Link>

          {/* Categories */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E6EBF1' }}>
            <p className="text-xs font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#8792A2' }}>Categories</p>
            {categories.map((cat, i) => (
              <Link key={i} to={`/browse?category=${encodeURIComponent(cat.name)}`}
                id={`mobile-cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = '#F6F9FC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}18` }}>
                  <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#0A2540' }}>{cat.name}</div>
                  <div className="text-xs" style={{ color: '#8792A2' }}>{cat.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile auth buttons */}
          <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid #E6EBF1' }}>
            {user ? (
              <button id="mobile-nav-logout" onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <>
                <Link to="/login" id="mobile-nav-signin" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm border"
                  style={{ color: '#0A2540', border: '1px solid #E6EBF1' }}>
                  <LogIn className="h-4 w-4" /> Sign in
                </Link>
                <Link to="/signup" id="mobile-nav-cta" onClick={() => setMobileOpen(false)}
                  className="btn-primary justify-center py-3">
                  Start for free <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Notifications Sheet (slide up from bottom) ── */}
      {user && bellOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(10,37,64,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => setBellOpen(false)}
          />
          {/* Sheet */}
          <div
            id="mobile-bell-sheet"
            className="relative rounded-t-3xl overflow-hidden"
            style={{ background: '#fff', maxHeight: '70vh', boxShadow: '0 -8px 40px rgba(50,50,93,0.18)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E6EBF1' }} />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#E6EBF1' }}>
              <span className="font-bold text-stripe-slate text-base">Notifications</span>
              <div className="flex gap-4">
                {unreadNotifs > 0 && (
                  <button onClick={markAllRead} className="text-sm font-semibold text-stripe-purple">Mark all read</button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifs} className="text-sm font-semibold text-red-500">Clear all</button>
                )}
              </div>
            </div>
            {/* List */}
            <div className="overflow-y-auto divide-y" style={{ maxHeight: '60vh', borderColor: '#F6F9FC' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Bell className="h-10 w-10 text-stripe-muted opacity-25 mb-3" />
                  <p className="text-sm text-stripe-muted font-semibold">No notifications yet</p>
                  <p className="text-xs text-stripe-muted mt-1">Order updates & reviews appear here</p>
                </div>
              ) : (
                notifications.map(n => {
                  return (
                    <button
                      key={n.id}
                      onClick={(e) => {
                        e.preventDefault();
                        if (n.link) navigate(n.link);
                        handleNotifClick(n);
                      }}
                      className="w-full flex items-start gap-3 px-5 py-4 text-left"
                      style={{ background: n.is_read ? '#fff' : '#635BFF08', textDecoration: 'none' }}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm leading-snug ${n.is_read ? 'text-stripe-steel font-medium' : 'text-stripe-slate font-bold'}`}>
                          {n.title}
                        </div>
                        <div className="text-xs text-stripe-muted mt-0.5 line-clamp-2">{n.body}</div>
                        <div className="text-[10px] text-stripe-muted mt-1">{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-stripe-purple shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (md:hidden) ── */}
      {user && !['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]" style={{ borderColor: '#E6EBF1' }}>
          <div className="flex items-center justify-around h-16 px-2">

            {/* Browse */}
            <Link to="/browse" className="flex flex-col items-center justify-center w-full h-full transition-colors group">
              <Search className="h-5 w-5 mb-1 transition-colors" style={{ color: location.pathname === '/browse' ? '#635BFF' : '#8792A2' }} />
              <span className="text-[10px] font-semibold transition-colors" style={{ color: location.pathname === '/browse' ? '#635BFF' : '#8792A2' }}>Browse</span>
            </Link>

            {/* 🔔 Notification Bell */}
            <button
              id="mobile-nav-bell"
              onClick={openBell}
              className="flex flex-col items-center justify-center w-full h-full transition-colors relative group"
            >
              <div className="relative">
                <Bell
                  className="h-5 w-5 mb-1 transition-colors"
                  style={{ color: bellOpen ? '#635BFF' : '#8792A2' }}
                />
                {unreadNotifs > 0 && (
                  <span
                    className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-[8px]"
                    style={{ background: '#EF4444' }}
                  >
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold transition-colors" style={{ color: bellOpen ? '#635BFF' : '#8792A2' }}>Alerts</span>
            </button>

            {/* Post (center floating button) */}
            <Link to="/services/new" className="flex flex-col items-center justify-center w-full h-full transition-colors relative group">
              <div className="absolute -top-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 transition-transform group-hover:scale-105"
                   style={{ background: '#635BFF', borderColor: '#fff', boxShadow: '0 8px 16px rgba(99,91,255,0.25)' }}>
                <PlusSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold mt-6 transition-colors" style={{ color: location.pathname === '/services/new' ? '#635BFF' : '#8792A2' }}>Post</span>
            </Link>

            {/* Messages */}
            <Link to="/messages" className="flex flex-col items-center justify-center w-full h-full transition-colors relative group">
              <div className="relative">
                <MessageCircle className="h-5 w-5 mb-1 transition-colors" style={{ color: location.pathname === '/messages' ? '#635BFF' : '#8792A2' }} />
                {unreadDMs > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-[8px]" style={{ background: '#FF6B9D' }}>
                    {unreadDMs > 9 ? '9+' : unreadDMs}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold transition-colors" style={{ color: location.pathname === '/messages' ? '#635BFF' : '#8792A2' }}>Messages</span>
            </Link>

          </div>
        </div>
      )}

    </>
  );
}
