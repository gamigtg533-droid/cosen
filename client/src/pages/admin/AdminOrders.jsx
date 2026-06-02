import { useState, useEffect } from 'react';
import {
  Search, ShieldAlert, ShoppingBag, Eye, X, Loader,
  Calendar, CreditCard, ArrowRight, User, Phone, CheckCircle,
  MessageCircle, Star, Sparkles, UserCheck, AlertTriangle
} from 'lucide-react';
import adminApi from '../../lib/adminApi';

const STATUS_CONFIG = {
  pending: { label: 'Pending Payment', bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  pending_negotiation: { label: 'Negotiating', bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
  inProgress: { label: 'In Progress', bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  delivered: { label: 'Delivered', bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  completed: { label: 'Completed', bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  disputed: { label: 'Disputed', bg: 'rgba(239, 68, 68, 0.2)', text: '#FCA5A5' },
  cancelled: { label: 'Cancelled', bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  // Selected order details for audit modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch orders list
  const fetchOrdersList = async (pageNumber = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getOrders({
        search,
        status: statusFilter,
        page: pageNumber,
        limit
      });
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setPage(pageNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  // Live-search when search or statusFilter changes
  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrdersList(1);
    }, search ? 350 : 0);

    return () => clearTimeout(t);
  }, [search, statusFilter]);

  // Trigger search immediately on submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrdersList(1);
  };

  // Open audit modal for order details
  const openOrderAudit = async (orderId) => {
    setModalLoading(true);
    setModalError('');
    setSelectedOrder(null);
    try {
      const res = await adminApi.getOrderDetail(orderId);
      if (res.data.success) {
        setSelectedOrder(res.data.order);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to load order audit details.');
    } finally {
      setModalLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Orders &amp; Service Status</h1>
          <p className="text-sm mt-1 text-white/40">Audit service lifecycles, payment states, and troubleshoot customer queries</p>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-lg">
          <input
            type="text"
            placeholder="Search Order ID, Service, Buyer, Seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 rounded-xl text-sm text-white placeholder-white/20 transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none'
            }}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #635BFF, #A78BFA)' }}
          >
            Search
          </button>
        </form>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs text-white transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none'
            }}
          >
            <option value="" className="bg-[#0D1426]">All Statuses</option>
            <option value="pending" className="bg-[#0D1426]">Pending Payment</option>
            <option value="pending_negotiation" className="bg-[#0D1426]">Negotiating</option>
            <option value="inProgress" className="bg-[#0D1426]">In Progress</option>
            <option value="delivered" className="bg-[#0D1426]">Delivered</option>
            <option value="completed" className="bg-[#0D1426]">Completed</option>
            <option value="disputed" className="bg-[#0D1426]">Disputed</option>
            <option value="cancelled" className="bg-[#0D1426]">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main orders table / list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-xs text-white/35">Loading orders database...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl text-center text-red-400 text-sm" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)' }}>
          <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white/50">No orders found</h3>
          <p className="text-xs text-white/30 mt-1">Try resetting filters or adjusting search parameters</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase font-bold tracking-wider" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                  <th className="py-4 px-5">Order ID</th>
                  <th className="py-4 px-5">Service Title</th>
                  <th className="py-4 px-5">Buyer</th>
                  <th className="py-4 px-5">Seller</th>
                  <th className="py-4 px-5 text-right">Price</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs text-white/85" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                {orders.map((o) => {
                  const st = STATUS_CONFIG[o.status] || { label: o.status, bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                  return (
                    <tr key={o._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-mono font-semibold" style={{ color: '#A5A1FF' }}>
                        #{String(o._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 px-5 font-medium max-w-[200px] truncate" title={o.service?.title}>
                        {o.service?.title || 'Custom Service'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold">{o.buyer?.name}</div>
                        <div className="text-[10px] text-white/35 truncate max-w-[150px]">{o.buyer?.email}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold">{o.seller?.name}</div>
                        <div className="text-[10px] text-white/35 truncate max-w-[150px]">{o.seller?.email}</div>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-white">
                        ₹{(o.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: st.bg, color: st.text }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => openOrderAudit(o._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/5 transition-all text-white border"
                          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-white/35">
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total orders)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => fetchOrdersList(page - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => fetchOrdersList(page + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#060814]/75 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          
          {/* Modal box */}
          <div className="relative rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10"
            style={{
              background: '#0D1426',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
            
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Order Audit Details</h3>
                  <p className="text-xs text-white/35 font-mono">ID: {selectedOrder._id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Row 1: General Info and Financials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Order Status */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Service Lifecyle State</div>
                  <div>
                    {(() => {
                      const st = STATUS_CONFIG[selectedOrder.status] || { label: selectedOrder.status, bg: 'rgba(255,255,255,0.05)', text: '#fff' };
                      return (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: st.bg, color: st.text }}>
                          {st.label}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-1.5 pt-1.5 border-t border-white/5 text-xs text-white/50">
                    <div className="flex justify-between">
                      <span>Created At:</span>
                      <span className="font-semibold text-white/80">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {selectedOrder.deliveredAt && (
                      <div className="flex justify-between">
                        <span>Delivered:</span>
                        <span className="font-semibold text-white/80">{new Date(selectedOrder.deliveredAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {selectedOrder.completedAt && (
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-semibold text-white/80">{new Date(selectedOrder.completedAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Financial Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Buyer Paid (Total):</span>
                      <span className="font-semibold text-white">₹{selectedOrder.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Platform Fee (10%):</span>
                      <span className="font-semibold text-white/60">- ₹{selectedOrder.platformFee?.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-bold">
                      <span style={{ color: '#00D4AA' }}>Seller Winnings:</span>
                      <span style={{ color: '#00D4AA' }}>₹{selectedOrder.sellerEarnings?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Information */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider">UPI Payout Tracker</div>
                  {selectedOrder.payout ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        {selectedOrder.payout.status === 'paid' ? (
                          <>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">💸 Paid successfully</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ Processing</span>
                          </>
                        )}
                      </div>
                      <div className="space-y-1.5 text-white/50 pt-1">
                        <div className="flex justify-between">
                          <span>UPI ID:</span>
                          <span className="font-mono font-bold text-white">{selectedOrder.payout.upi_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Earnings:</span>
                          <span className="font-bold text-white">₹{selectedOrder.payout.amount?.toLocaleString()}</span>
                        </div>
                        {selectedOrder.payout.paid_at && (
                          <div className="flex justify-between">
                            <span>Paid Date:</span>
                            <span className="font-semibold text-white/70">{new Date(selectedOrder.payout.paid_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <CreditCard className="w-6 h-6 text-white/10 mx-auto mb-1.5" />
                      <div className="text-xs text-white/35">No payout record created yet</div>
                      <div className="text-[10px] text-white/20 mt-0.5">Order has not been completed by buyer</div>
                    </div>
                  )}
                </div>

              </div>

              {/* Row 2: Service details, Buyer and Seller profile chip cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Service Details */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Service Offered
                  </div>
                  {selectedOrder.service ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="font-semibold text-white text-sm leading-snug">{selectedOrder.service.title}</div>
                      <div className="text-white/40">Category: <span className="text-white/60 font-semibold">{selectedOrder.service.category}</span></div>
                      <div className="text-white/40">Delivery Window: <span className="text-white/60 font-semibold">{selectedOrder.service.deliveryDays} Days</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/35">Service information not available</div>
                  )}
                </div>

                {/* Buyer profile */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Buyer Details
                  </div>
                  {selectedOrder.buyer ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5">
                          {selectedOrder.buyer.avatar?.url ? (
                            <img src={selectedOrder.buyer.avatar.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-900/50 flex items-center justify-center font-bold text-blue-300">{selectedOrder.buyer.name?.[0]}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{selectedOrder.buyer.name}</div>
                          <div className="text-[10px] text-white/35 truncate">{selectedOrder.buyer.email}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-white/30" /> Phone:</span>
                          <span className="font-mono text-white/70">{selectedOrder.buyer.phone || 'Not Set'}</span>
                        </div>
                        {selectedOrder.buyer.phone && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span>Phone Verification:</span>
                            <span className={selectedOrder.buyer.isPhoneVerified ? 'text-emerald-400 font-semibold' : 'text-red-400/80 font-semibold'}>
                              {selectedOrder.buyer.isPhoneVerified ? 'Verified ✓' : 'Unverified'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/35">Buyer profile not available</div>
                  )}
                </div>

                {/* Seller profile */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Seller Details
                  </div>
                  {selectedOrder.seller ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5">
                          {selectedOrder.seller.avatar?.url ? (
                            <img src={selectedOrder.seller.avatar.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-900/50 flex items-center justify-center font-bold text-emerald-300">{selectedOrder.seller.name?.[0]}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{selectedOrder.seller.name}</div>
                          <div className="text-[10px] text-white/35 truncate">{selectedOrder.seller.email}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-white/30" /> Phone:</span>
                          <span className="font-mono text-white/70">{selectedOrder.seller.phone || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>UPI ID:</span>
                          <span className="font-mono text-white/70">{selectedOrder.seller.upiId || 'Not Set'}</span>
                        </div>
                        {selectedOrder.seller.phone && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span>Phone Verification:</span>
                            <span className={selectedOrder.seller.isPhoneVerified ? 'text-emerald-400 font-semibold' : 'text-red-400/80 font-semibold'}>
                              {selectedOrder.seller.isPhoneVerified ? 'Verified ✓' : 'Unverified'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/35">Seller profile not available</div>
                  )}
                </div>

              </div>

              {/* Row 3: Reviews Audit & Delivery Notes */}
              {(selectedOrder.review || selectedOrder.deliveryNote) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedOrder.deliveryNote && (
                    <div className="rounded-xl p-4 space-y-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Delivery Note / Proof Details</div>
                      <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed italic">
                        "{selectedOrder.deliveryNote}"
                      </p>
                    </div>
                  )}

                  {selectedOrder.review && (
                    <div className="rounded-xl p-4 space-y-2 border border-white/5 font-display" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        Buyer Rating Review
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < selectedOrder.review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-white/80">{selectedOrder.review.rating} / 5 stars</span>
                      </div>
                      {selectedOrder.review.comment && (
                        <p className="text-xs text-white/60 italic leading-relaxed pt-1">
                          "{selectedOrder.review.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Transcript Audit Section */}
              <div className="rounded-xl p-5 border border-white/5 flex flex-col space-y-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="text-xs font-bold text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    Buyer-Seller Conversation Audit Transcript
                  </div>
                  <span className="text-[10px] text-white/30">Total messages: {selectedOrder.messages?.length || 0}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-lg border border-white/[0.03]" style={{ background: 'rgba(0,0,0,0.15)' }}>
                  {selectedOrder.messages && selectedOrder.messages.length > 0 ? (
                    selectedOrder.messages.map((m) => {
                      const isSellerSender = m.senderId === selectedOrder.seller?._id;
                      const senderBadgeColor = isSellerSender ? '#00D4AA' : '#635BFF';
                      return (
                        <div key={m._id} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider text-white"
                              style={{ backgroundColor: senderBadgeColor }}>
                              {isSellerSender ? 'Seller' : 'Buyer'}
                            </span>
                            <span className="font-semibold text-white/80">{m.senderName}</span>
                            <span className="text-[9px] text-white/25">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-white/70 pl-2 border-l border-white/10 py-0.5 whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-white/20 italic">
                      No chat conversation recorded for this order
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal footer */}
            <div className="flex justify-between items-center p-4 border-t border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                This panel is strictly for administrative troubleshooting and query audits.
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:bg-white/5 border border-white/10"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
