import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, ChevronRight, Star, TrendingUp, ShoppingBag,
  MessageCircle, Clock, Loader, LogIn, ArrowUpRight,
  ArrowDownRight, IndianRupee, Package, Zap, BarChart2,
  Pencil, Trash2, AlertTriangle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

const MOCK_ORDERS = [
  { _id: 'CS1092', service: { title: 'Python Tutoring & Debugging' }, seller: { name: 'Alex M.' }, price: 499, status: 'inProgress', createdAt: new Date() },
  { _id: 'AD5509', service: { title: 'Logo Design for CS Club' }, seller: { name: 'Sarah T.' }, price: 399, status: 'delivered', createdAt: new Date() },
  { _id: 'WR2201', service: { title: 'CV Review & Rewrite' }, seller: { name: 'James L.' }, price: 1499, status: 'completed', createdAt: new Date() },
  { _id: 'UI3301', service: { title: 'React Dashboard UI' }, seller: { name: 'Priya K.' }, price: 2999, status: 'pending', createdAt: new Date() },
];

const STATUS_MAP = {
  pending:    { label: 'Pending',     color: '#8792A2', bg: '#8792A215' },
  inProgress: { label: 'In Progress', color: '#FF9F43', bg: '#FF9F4315' },
  delivered:  { label: 'Delivered',   color: '#00D4AA', bg: '#00D4AA15' },
  completed:  { label: 'Completed',   color: '#635BFF', bg: '#635BFF15' },
  disputed:   { label: 'Disputed',    color: '#EF4444', bg: '#EF444415' },
  cancelled:  { label: 'Cancelled',   color: '#8792A2', bg: '#8792A215' },
};

// Mini SVG Line Chart
function MiniLineChart({ data = [], color = '#635BFF', height = 80 }) {
  const w = 300, h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 16) - 4;
    return `${x},${y}`;
  }).join(' ');
  const areaBottom = `${w},${h} 0,${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaBottom}`} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 16) - 4;
        return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />;
      })}
    </svg>
  );
}

// Gauge / Semi-donut chart
function GaugeChart({ value = 0, max = 100, color = '#635BFF', label = '' }) {
  const pct = Math.min(value / max, 1);
  const r = 70, cx = 90, cy = 90;
  const circumference = Math.PI * r;
  const filled = pct * circumference;
  const segments = [
    { color: '#00D4AA', pct: 0.25 },
    { color: '#635BFF', pct: 0.25 },
    { color: '#FF9F43', pct: 0.25 },
    { color: '#1a1a2e', pct: 0.25 },
  ];
  let offset = 0;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 100" className="w-full max-w-[220px]">
        {segments.map((seg, i) => {
          const len = seg.pct * circumference;
          const dashOffset = circumference - offset;
          const el = (
            <path
              key={i}
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${circumference}`}
              strokeDashoffset={`${-offset}`}
              strokeLinecap="butt"
              style={{ transform: 'none' }}
            />
          );
          offset += len;
          return el;
        })}
        {/* needle */}
        {(() => {
          const angle = Math.PI * pct;
          const nx = cx - r * Math.cos(angle);
          const ny = cy - r * Math.sin(angle) + 2;
          return (
            <line x1={cx} y1={cy} x2={nx} y2={ny}
              stroke="#0A2540" strokeWidth="3" strokeLinecap="round" />
          );
        })()}
        <circle cx={cx} cy={cy} r="6" fill="#0A2540" />
      </svg>
      <div className="text-2xl font-bold text-stripe-slate -mt-2">{label}</div>
      <div className="text-xs text-stripe-muted mt-1">Spending This Week</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // service object to confirm

  const handleDeleteService = async (service) => {
    try {
      setDeletingId(service._id);
      await api.delete(`/services/${service._id}`);
      setMyServices(prev => prev.filter(s => s._id !== service._id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const today = new Date();

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, servicesRes] = await Promise.all([
        api.get('/orders'),
        api.get(`/services/user/${user._id}`),
      ]);
      setOrders(ordersRes.data.orders?.length ? ordersRes.data.orders : MOCK_ORDERS);
      setMyServices(servicesRes.data.services || []);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-16 px-4">
        <div className="stripe-card p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-stripe-purple/10 flex items-center justify-center mx-auto mb-5">
            <LogIn className="h-7 w-7 text-stripe-purple" />
          </div>
          <h2 className="font-display font-bold text-stripe-slate text-xl mb-2">Sign in to view your dashboard</h2>
          <p className="text-stripe-muted text-sm mb-6">Track orders, manage services, and view your earnings.</p>
          <Link to="/login" className="btn-primary justify-center w-full py-3">
            Sign in <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/signup" className="block mt-3 text-sm text-stripe-purple font-semibold hover:underline">Create an account</Link>
        </div>
      </div>
    );
  }

  const totalEarnings = orders
    .filter(o => o.status === 'completed' && (typeof o.seller === 'object' ? o.seller?._id : o.seller) === user._id)
    .reduce((sum, o) => sum + (o.sellerEarnings || o.price || 0), 0);
  const activeOrders = orders.filter(o => o.status === 'inProgress').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalSpent = orders
    .filter(o => o.status === 'completed' && (typeof o.buyer === 'object' ? o.buyer?._id : o.buyer) === user._id)
    .reduce((sum, o) => sum + (o.price || 0), 0);

  const statsCards = [
    {
      label: 'Total Earnings', value: `₹${(totalEarnings || 9800).toLocaleString('en-IN')}`,
      sub: '+6.53%', subLabel: 'Last Week Total', up: true, icon: IndianRupee, color: '#635BFF',
    },
    {
      label: 'Total Orders', value: orders.length || 1009,
      sub: '+23.09%', subLabel: 'Last Week Total', up: true, icon: ShoppingBag, color: '#00D4AA',
    },
    {
      label: 'Completed', value: completedOrders || 1231,
      sub: '-1.53%', subLabel: 'Last Month Total', up: false, icon: Package, color: '#FF9F43',
    },
    {
      label: 'Services Posted', value: myServices.length || 4,
      sub: '+5.87%', subLabel: 'Last Week Total', up: true, icon: Zap, color: '#FF6B9D',
    },
  ];

  const financeData = [42, 55, 38, 70, 50, 90, 65, 110, 80, 95, 60, 120];
  const weeklySpend = totalSpent || 5476;
  const maxSpend = 10000;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen pt-16" style={{ background: '#F6F9FC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-stripe-slate text-3xl">Dashboard</h1>
            <p className="text-stripe-muted mt-1 text-sm">
              Welcome back, <span className="font-semibold text-stripe-slate">{user.name?.split(' ')[0]}</span>
              {user.department && <> · {user.department}</>}
            </p>
          </div>
          <Link to="/services/new" id="dashboard-post-service" className="btn-primary py-2.5 px-5">
            <Plus className="h-4 w-4" /> Post a Service
          </Link>
        </div>

        {/* ── Row 1: Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((s, i) => (
            <div key={i} id={`stat-card-${i}`}
              className="bg-white rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: '#E6EBF1' }}>
              <div className="text-xs font-semibold text-stripe-muted mb-2">{s.label}</div>
              <div className="text-2xl font-bold text-stripe-slate mb-3">{s.value}</div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${s.up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.sub}
                </span>
                <span className="text-xs text-stripe-muted">{s.subLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Gauge + Finance Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* My Expenses */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E6EBF1' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-stripe-slate">My Expenses</h2>
              <span className="text-xs text-stripe-muted bg-stripe-bg px-3 py-1 rounded-full">Last 7 Days ▾</span>
            </div>
            <GaugeChart value={weeklySpend} max={maxSpend} label={`₹${weeklySpend.toLocaleString('en-IN')}`} />
            <div className="flex justify-center gap-5 mt-4 flex-wrap">
              {[
                { label: 'Services', color: '#00D4AA' },
                { label: 'Misc', color: '#1a1a2e' },
                { label: 'Tools', color: '#635BFF' },
                { label: 'Other', color: '#FF9F43' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-stripe-muted">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* My Finance */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E6EBF1' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-stripe-slate">My Finance</h2>
              <span className="text-xs text-stripe-muted bg-stripe-bg px-3 py-1 rounded-full">Last 7 Days ▾</span>
            </div>
            <div className="relative">
              {/* Tooltip */}
              <div className="absolute right-8 top-2 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg z-10">
                ₹{(totalEarnings || 4100).toLocaleString('en-IN')}
                <div className="text-[10px] font-normal opacity-80">Revenue from orders</div>
              </div>
              <MiniLineChart data={financeData} color="#22c55e" height={110} />
            </div>
            <div className="text-xs text-stripe-muted mt-3 text-right">
              Savings this month: <span className="text-green-600 font-semibold">+6.79%</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Transactions + Calendar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* My Transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6" style={{ borderColor: '#E6EBF1' }}>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-bold text-stripe-slate">My Transactions</h2>
              <div className="flex items-center gap-3">
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E6EBF1' }}>
                  {['orders', 'services'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all ${activeTab === t ? 'bg-stripe-purple text-white' : 'text-stripe-muted hover:bg-stripe-bg'}`}>
                      {t === 'orders' ? 'Transaction Overview' : 'My Services'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-stripe-muted bg-stripe-bg px-3 py-1.5 rounded-full">Last 7 Days ▾</span>
              </div>
            </div>

            {activeTab === 'orders' ? (
              <>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs font-semibold text-stripe-muted uppercase tracking-wider pb-3 mb-1"
                  style={{ borderBottom: '1px solid #E6EBF1' }}>
                  <span>Date</span>
                  <span>Transaction Details</span>
                  <span className="hidden md:block">Transaction ID</span>
                  <span className="text-right">Total Amount</span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10 text-stripe-muted">
                    <Loader className="h-5 w-5 animate-spin mr-2 text-stripe-purple" /> Loading...
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#F0F4F8' }}>
                    {orders.slice(0, 5).map((order, i) => {
                      const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                      const sellerName = typeof order.seller === 'object' ? order.seller?.name : 'Seller';
                      const d = new Date(order.createdAt);
                      return (
                        <div key={order._id || i}
                          className="grid grid-cols-3 md:grid-cols-4 gap-2 items-center py-3.5 cursor-pointer hover:bg-stripe-bg rounded-xl px-2 -mx-2 transition-colors"
                          onClick={() => navigate(`/orders/${order._id}`)}>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-stripe-slate truncate">
                              {d.getDate()} {monthNames[d.getMonth()].slice(0, 3)} {d.getFullYear()}
                            </div>
                            <div className="text-[10px] text-stripe-muted">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: st.bg }}>
                              <ShoppingBag className="h-3.5 w-3.5" style={{ color: st.color }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-stripe-slate truncate">{order.service?.title || 'Service'}</div>
                              <div className="text-[10px] text-stripe-muted truncate">{sellerName}</div>
                            </div>
                          </div>
                          <div className="hidden md:block text-xs text-stripe-muted font-mono truncate min-w-0">
                            #{String(order._id).slice(-12).toUpperCase()}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ color: st.color, background: st.bg }}>
                              ₹{(order.price || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 mt-2">
                {myServices.length === 0 ? (
                  <div className="text-center py-10">
                    <Zap className="h-10 w-10 text-stripe-muted mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-stripe-muted">No services yet.</p>
                    <Link to="/services/new" className="btn-primary mt-4 mx-auto">
                      <Plus className="h-4 w-4" /> Post a Service
                    </Link>
                  </div>
                ) : (
                  myServices.map(s => (
                    <div key={s._id} className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-sm transition-all"
                      style={{ borderColor: '#E6EBF1' }}>
                      <div className="w-10 h-10 rounded-xl bg-stripe-purple/10 flex items-center justify-center shrink-0">
                        <BarChart2 className="h-5 w-5 text-stripe-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-stripe-slate truncate">{s.title}</div>
                        <div className="flex items-center gap-2 text-xs text-stripe-muted mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {s.rating?.toFixed(1) || '0.0'} · {s.reviewCount || 0} reviews
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-stripe-slate">₹{s.price?.toLocaleString('en-IN')}</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'text-green-600 bg-green-50' : 'text-stripe-muted bg-stripe-bg'}`}>
                          {s.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      {/* Edit / Delete buttons */}
                      <div className="flex gap-1 shrink-0">
                        <Link
                          to={`/services/new?edit=${s._id}`}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-stripe-muted hover:text-stripe-purple hover:border-stripe-purple transition-all"
                          style={{ borderColor: '#E6EBF1' }}
                          title="Edit service"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(s)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-stripe-muted hover:text-red-500 hover:border-red-300 transition-all"
                          style={{ borderColor: '#E6EBF1' }}
                          title="Delete service"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Calendar + Quick Actions */}
          <div className="flex flex-col gap-5">

            {/* Calendar */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E6EBF1' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-stripe-slate text-sm">
                    {dayNames[today.getDay()]} {today.getDate()} {monthNames[today.getMonth()]} {today.getFullYear()}
                  </span>
                </div>
                <div className="flex gap-2 text-stripe-muted">
                  <button className="w-6 h-6 rounded-full border flex items-center justify-center text-xs hover:bg-stripe-bg" style={{ borderColor: '#E6EBF1' }}>?</button>
                  <button className="w-6 h-6 rounded-full border flex items-center justify-center text-xs hover:bg-stripe-bg" style={{ borderColor: '#E6EBF1' }}>i</button>
                </div>
              </div>

              {/* Tab row */}
              <div className="flex gap-1 mb-4 border-b pb-3" style={{ borderColor: '#E6EBF1' }}>
                {['Orders', 'Events', 'Deadlines', 'Updates'].map((t, i) => (
                  <button key={t}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${i === 0 ? 'text-stripe-purple border-b-2 border-stripe-purple' : 'text-stripe-muted hover:text-stripe-slate'}`}>
                    {t}
                    {i === 0 && orders.filter(o => o.status === 'inProgress').length > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5">
                        {orders.filter(o => o.status === 'inProgress').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active Orders as Events */}
              <div className="space-y-3">
                {orders.filter(o => o.status === 'inProgress').slice(0, 2).map((o, i) => (
                  <div key={i} className="p-3 rounded-xl border hover:shadow-sm cursor-pointer transition-all"
                    style={{ borderColor: '#E6EBF1' }}
                    onClick={() => navigate(`/orders/${o._id}`)}>
                    <div className="text-xs font-semibold text-stripe-slate truncate">{o.service?.title || 'Active Order'}</div>
                    <div className="text-[10px] text-stripe-muted mt-1">In Progress · Click to manage</div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      <Link to="/messages" className="text-[10px] text-stripe-purple font-semibold hover:underline">
                        Message Seller
                      </Link>
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status === 'inProgress').length === 0 && (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-stripe-muted mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-stripe-muted">No active orders right now</p>
                    <Link to="/browse" className="text-xs text-stripe-purple font-semibold hover:underline mt-1 block">Browse services →</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E6EBF1' }}>
              <h2 className="font-bold text-stripe-slate text-sm mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Browse Services', href: '/browse', color: '#635BFF', icon: ShoppingBag },
                  { label: 'Post a Service', href: '/services/new', color: '#00D4AA', icon: Plus },
                  { label: 'Messages', href: '/messages', color: '#FF6B9D', icon: MessageCircle },
                  { label: 'My Profile', href: '/profile', color: '#FF9F43', icon: Star },
                ].map((a, i) => (
                  <Link key={i} to={a.href}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm hover:-translate-y-0.5 transition-all group"
                    style={{ borderColor: '#E6EBF1' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${a.color}15` }}>
                      <a.icon className="h-4 w-4" style={{ color: a.color }} />
                    </div>
                    <span className="text-sm font-semibold text-stripe-slate flex-1">{a.label}</span>
                    <ChevronRight className="h-4 w-4 text-stripe-muted group-hover:text-stripe-purple transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,37,64,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-stripe-slate text-base">Delete Service?</h3>
                <p className="text-xs text-stripe-muted">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-stripe-steel mb-6">
              Are you sure you want to delete <strong className="text-stripe-slate">{confirmDelete.title}</strong>?
              All associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm text-stripe-muted hover:bg-stripe-bg transition-all"
                style={{ borderColor: '#E6EBF1' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(confirmDelete)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: '#EF4444' }}
              >
                {deletingId === confirmDelete._id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
