import { useState, useEffect } from 'react';
import {
  Users, Package, ShoppingBag, AlertTriangle,
  ShieldCheck, TrendingUp, DollarSign, CheckCircle, Clock
} from 'lucide-react';
import adminApi from '../../lib/adminApi';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Simple SVG bar chart component ────────────────────────────
function BarChart({ data, colorStart = '#635BFF', colorEnd = '#00D4AA' }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No data yet</div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const hue = Math.round((i / (data.length - 1 || 1)) * 120);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#A5A1FF' }}>{d.value}</span>
            <div className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: `linear-gradient(to top, ${colorStart}, ${colorEnd})`,
                opacity: 0.7 + (pct / max) * 0.3,
              }} />
            <span className="text-[9px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart component ──────────────────────────────────────
function DonutChart({ data }) {
  const COLORS = ['#635BFF', '#00D4AA', '#FF9F43', '#FF6B9D', '#4FC3F7', '#A855F7', '#34D399'];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const radius = 40;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
        {data.map((d, i) => {
          const len = (d.value / total) * circ;
          const el = (
            <circle key={d.label} cx="50" cy="50" r={radius} fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{d.label}</span>
            <span className="font-bold" style={{ color: '#fff' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(8px)',
      }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: trend >= 0 ? 'rgba(0,212,170,0.15)' : 'rgba(239,68,68,0.15)', color: trend >= 0 ? '#00D4AA' : '#F87171' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
        {sub && <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data.stats))
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#635BFF', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>
  );

  const categoryData = Object.entries(stats?.categoryBreakdown || {}).map(([label, value]) => ({ label, value }));
  const signupData = Object.entries(stats?.signupsByDay || {}).map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Real-time analytics and platform health</p>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={fmtNum(stats?.totalUsers)} color="#635BFF" sub={`${fmtNum(stats?.verifiedUsers)} verified`} />
        <StatCard icon={ShieldCheck} label="Pending Reviews" value={fmtNum(stats?.pendingVerifications)} color="#00D4AA" sub="Student ID verifications" />
        <StatCard icon={Package} label="Active Services" value={fmtNum(stats?.activeServices)} color="#FF9F43" />
        <StatCard icon={AlertTriangle} label="Open Disputes" value={fmtNum(stats?.openDisputes)} color="#EF4444" sub="Requires mediation" />
      </div>

      {/* Financial metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Total Escrow Volume" value={fmt(stats?.totalEscrowVolume)} color="#635BFF" sub="All-time completed orders" />
        <StatCard icon={TrendingUp} label="Platform Revenue" value={fmt(stats?.totalPlatformRevenue)} color="#00D4AA" sub="Rank-based commission (Bronze 10%, Silver 6%, Gold 3%)" />
        <StatCard icon={CheckCircle} label="Completed Orders" value={fmtNum(stats?.completedOrders)} color="#A855F7" sub={`of ${fmtNum(stats?.totalOrders)} total`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signups chart */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">New Signups — Last 7 Days</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Student registrations per day</p>
          </div>
          <BarChart data={signupData} colorStart="#635BFF" colorEnd="#A78BFA" />
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Services by Category</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Active service distribution</p>
          </div>
          {categoryData.length > 0 ? <DonutChart data={categoryData} /> : (
            <div className="flex items-center justify-center h-24 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Quick action links */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(99,91,255,0.07)', border: '1px solid rgba(99,91,255,0.2)' }}>
        <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {stats?.pendingVerifications > 0 && (
            <a href="/admin/verifications" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(99,91,255,0.25)', border: '1px solid rgba(99,91,255,0.4)', color: '#A5A1FF' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Review {stats.pendingVerifications} Pending IDs
            </a>
          )}
          {stats?.openDisputes > 0 && (
            <a href="/admin/disputes" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Resolve {stats.openDisputes} Disputes
            </a>
          )}
          <a href="/admin/users" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00D4AA' }}>
            <Users className="w-3.5 h-3.5" />
            Manage Users
          </a>
          <a href="/admin/services" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.2)', color: '#FF9F43' }}>
            <Package className="w-3.5 h-3.5" />
            Moderate Services
          </a>
        </div>
      </div>
    </div>
  );
}
