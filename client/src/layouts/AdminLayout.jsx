import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShieldCheck, Gavel, Users, Package,
  ChevronRight, LogOut, Menu, X, Bell, IndianRupee, ShoppingBag, Image, CalendarDays
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import adminApi from '../lib/adminApi';
import api from '../lib/api';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { to: '/admin/verifications', icon: ShieldCheck, label: 'Verifications', badgeKey: 'pendingVerifications' },
  { to: '/admin/disputes', icon: Gavel, label: 'Disputes', badgeKey: 'openDisputes' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', badge: null },
  { to: '/admin/users', icon: Users, label: 'Users', badge: null },
  { to: '/admin/services', icon: Package, label: 'Services', badge: null },
  { to: '/admin/payouts', icon: IndianRupee, label: 'Payouts', badgeKey: 'pendingPayouts' },
  { to: '/admin/banners', icon: Image, label: 'Banners', badge: null },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({ pendingVerifications: 0, openDisputes: 0 });

  useEffect(() => {
    adminApi.getStats().then(res => {
      const s = res.data.stats;
      setBadges({ pendingVerifications: s.pendingVerifications, openDisputes: s.openDisputes, pendingPayouts: 0 });
    }).catch(() => {});
    // Also fetch pending payouts count
    api.get('/payouts/pending').then(res => {
      setBadges(prev => ({ ...prev, pendingPayouts: res.data.payouts?.length || 0 }));
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-[#0A0F1E] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}
        style={{
          background: 'linear-gradient(180deg, #0D1426 0%, #0A0F1E 100%)',
          borderRight: '1px solid rgba(99,91,255,0.15)',
        }}
      >
        {/* Logo / header */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid rgba(99,91,255,0.12)' }}>
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <img src="/cosen_brand_logo.svg" alt="Cosen Logo" className="w-full h-full object-contain brand-logo-img" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight transition-colors group-hover:text-purple-400" style={{ fontFamily: 'Syne, sans-serif' }}>Cosen Admin</p>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Control Panel</p>
            </div>
          </Link>
          <button className="md:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin user chip */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.15)' }}>
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-500/30 shrink-0">
              {user?.avatar?.url
                ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-xs font-bold">{user?.name?.[0]}</div>
              }
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] font-medium" style={{ color: '#635BFF' }}>Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Navigation</p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : (item.badge || 0);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'linear-gradient(135deg, rgba(99,91,255,0.2), rgba(0,212,170,0.08))',
                  border: '1px solid rgba(99,91,255,0.25)',
                } : {}}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {badgeCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold"
                      style={{ background: item.badgeKey === 'openDisputes' ? 'rgba(239,68,68,0.25)' : 'rgba(99,91,255,0.3)', color: item.badgeKey === 'openDisputes' ? '#FCA5A5' : '#A5A1FF' }}>
                      {badgeCount}
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(99,91,255,0.1)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Overlay on mobile ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: 'rgba(10,15,30,0.9)', borderBottom: '1px solid rgba(99,91,255,0.1)', backdropFilter: 'blur(12px)' }}>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <img src="/cosen_brand_logo.svg" alt="Cosen Logo" className="w-5 h-5 object-contain" />
            <span>Cosen Admin Control Panel</span>
          </div>
          <div className="flex items-center gap-3">
            {(badges.pendingVerifications + badges.openDisputes) > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-white/40" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#635BFF', color: '#fff' }}>
                  {badges.pendingVerifications + badges.openDisputes}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
