import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Send, Loader, Clock, CheckCircle, AlertTriangle,
  Shield, Check, Info, MessageCircle, Star
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useRazorpay from '../hooks/useRazorpay';
import api from '../lib/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// WhatsApp green brand colour
const WA_GREEN = '#25D366';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const chatBottomRef = useRef(null);
  const socketRef    = useRef(null);
  const inputRef     = useRef(null);

  const [order,      setOrder]      = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');
  const [connected,  setConnected]  = useState(false);
  const [isOtherPartyOnline, setIsOtherPartyOnline] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Negotiation & Payment State
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [priceSuccessMsg, setPriceSuccessMsg] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const openCheckout = useRazorpay();

  /* ── Fetch order + messages ─────────────────────────── */
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      try {
        const [orderRes, msgRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get(`/messages/order/${id}`),
        ]);
        setOrder(orderRes.data.order);
        setMessages(msgRes.data.messages || []);
      } catch {
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, user]);

  /* ── Socket.io ──────────────────────────────────────── */
  useEffect(() => {
    if (!user || !order) return;

    const isBuyer = order.buyer._id === user._id;
    const otherPartyId = isBuyer ? order.seller._id : order.buyer._id;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register_user', user._id);
      socket.emit('get_online_users');
    });

    socket.on('online_users_list', (users) => {
      if (users.includes(otherPartyId)) setIsOtherPartyOnline(true);
    });

    socket.on('user_online', (userId) => {
      if (userId === otherPartyId) setIsOtherPartyOnline(true);
    });

    socket.on('user_offline', (userId) => {
      if (userId === otherPartyId) setIsOtherPartyOnline(false);
    });

    socket.emit('join_order', id);

    // Server saves to DB and broadcasts the full message object back to everyone
    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates (same id already in list)
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => socket.disconnect();
  }, [id, user, order]);

  /* ── Auto-scroll ────────────────────────────────────── */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message (via socket only — server saves it) ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setNewMessage('');
    inputRef.current?.focus();

    try {
      // Emit to server — server saves to DB and broadcasts back
      socketRef.current?.emit('send_message', {
        orderId:  id,
        senderId: user._id,
        content,
      });
    } finally {
      setSending(false);
    }
  };

  /* ── Order status actions ───────────────────────────── */
  const updateStatus = async (action) => {
    try {
      const { data } = await api.put(`/orders/${id}/${action}`);
      if (data.success) {
        setOrder(prev => ({ ...prev, status: data.order.status }));
        if (action === 'complete') {
          setShowReviewModal(true);
        }
      }
    } catch {
      alert(`Failed to ${action} order.`);
    }
  };

  /* ── Review Submission ──────────────────────────────── */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const { data } = await api.post('/reviews', {
        orderId: id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (data.success) {
        setOrder(prev => ({ ...prev, isReviewed: true, review: data.review }));
        setShowReviewModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ── Negotiation: Set Final Price (Seller) ──────────── */
  const handleSetPrice = async () => {
    if (!negotiationPrice || Number(negotiationPrice) < 50) {
      alert('Price must be at least ₹50');
      return;
    }
    setUpdatingPrice(true);
    try {
      const { data } = await api.put(`/orders/${id}/set-price`, { price: negotiationPrice });
      if (data.success) {
        setOrder(data.order);
        setNegotiationPrice('');
        setPriceSuccessMsg('Price locked successfully!');
        setTimeout(() => setPriceSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update price');
    } finally {
      setUpdatingPrice(false);
    }
  };

  /* ── Pay Pending Order (Buyer) ──────────────────────── */
  const handlePayPendingOrder = async () => {
    setPayLoading(true);
    try {
      const { data } = await api.post('/payments/create-order-for-pending', { orderId: id });
      if (!data.success) {
        alert(data.message || 'Could not initiate payment.');
        setPayLoading(false);
        return;
      }
      
      setPayLoading(false);
      openCheckout({
        options: {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.razorpayOrderId,
          name: 'Cosen Marketplace',
          description: `Payment for Order #${String(id).slice(-8)}`,
          prefill: { name: user.name, email: user.email },
          notes: { orderId: id }
        },
        onSuccess: async (response) => {
          setPayLoading(true);
          try {
            const verifyRes = await api.post('/payments/verify-pending', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: id
            });
            if (verifyRes.data.success) {
              navigate('/payment-success', {
                state: { order: verifyRes.data.order, paymentId: response.razorpay_payment_id },
              });
            }
          } catch {
            alert('Verification failed. Contact support.');
          } finally {
            setPayLoading(false);
          }
        },
        onDismiss: () => {
          setPayLoading(false);
        }
      });
    } catch (err) {
      setPayLoading(false);
      alert(err.response?.data?.message || 'Payment initiation failed.');
    }
  };

  /* ── WhatsApp link builder ──────────────────────────── */
  /* Only the SELLER's phone needs to be verified. Buyer's is optional. */
  const buildWhatsApp = () => {
    if (!order) return null;

    const sellerPhone    = order.seller?.phone;
    const sellerVerified = order.seller?.isPhoneVerified;

    // Button only works if the seller has a verified phone number
    if (!sellerVerified || !sellerPhone) return null;

    const serviceTitle = order.service?.title || 'Service';
    const text = encodeURIComponent(`Hi! I ordered your "${serviceTitle}" on Cosen 👋`);
    const phone = sellerPhone.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${text}`;
  };

  /* ── Loading / error states ─────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-20">
      <Loader className="h-6 w-6 text-stripe-purple animate-spin" />
    </div>
  );
  if (error || !order) return (
    <div className="min-h-screen bg-stripe-bg flex items-center justify-center pt-20 text-stripe-slate">
      {error || 'Order not found'}
    </div>
  );

  const isBuyer    = order.buyer._id === user._id;
  const otherParty = isBuyer ? order.seller : order.buyer;
  const waLink     = buildWhatsApp();

  // Status badge
  const statusConfig = {
    pending:             { bg: 'bg-slate-100', text: 'text-slate-600',  icon: Clock },
    pending_negotiation: { bg: 'bg-amber-100', text: 'text-amber-700',  icon: AlertTriangle },
    inProgress:          { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: Loader },
    delivered:           { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: Check },
    completed:           { bg: 'bg-green-50',  text: 'text-green-600',  icon: CheckCircle },
    disputed:            { bg: 'bg-red-50',    text: 'text-red-600',    icon: AlertTriangle },
  };
  const st  = statusConfig[order.status] || statusConfig.pending;
  const StIcon = st.icon;

  return (
    <div className="min-h-screen bg-stripe-bg pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between bg-white stripe-card p-4 sm:p-6 mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-stripe-slate text-xl mb-1">
              {order.service?.title || 'Custom Service'}
            </h1>
            <p className="text-sm text-stripe-muted">
              Order #{String(order._id).slice(-8).toUpperCase()}
              <span className="hidden sm:inline"> · {new Date(order.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
            <StIcon className="h-3.5 w-3.5" />
            {order.status === 'pending_negotiation' ? 'Pending Negotiation' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: Chat ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col h-[65vh] stripe-card bg-white overflow-hidden">

            {/* Chat header */}
            <div className="p-4 border-b border-stripe-border bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-stripe-purple text-white flex items-center justify-center font-bold text-sm">
                    {otherParty.name?.split(' ').map(n => n[0]).join('').slice(0,2) || '?'}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: isOtherPartyOnline ? '#22c55e' : '#94a3b8' }}
                    title={isOtherPartyOnline ? 'Online' : 'Offline'}
                  />
                </div>
                <div>
                  <div className="font-semibold text-stripe-slate text-sm">{otherParty.name}</div>
                  <div className="text-xs text-stripe-muted">{isBuyer ? 'Seller' : 'Buyer'}</div>
                </div>
              </div>

              {/* WhatsApp button */}
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: WA_GREEN, boxShadow: `0 4px 14px ${WA_GREEN}55` }}
                  title={`Chat with ${otherParty.name} on WhatsApp`}
                >
                  {/* WhatsApp SVG icon */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-stripe-muted bg-slate-100 px-3 py-1.5 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 opacity-40">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Seller hasn't verified a phone number yet
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <MessageCircle className="h-10 w-10 text-stripe-muted mx-auto mb-3 opacity-40" />
                  <p className="text-stripe-muted text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((m) => {
                const isMine = (m.sender?._id || m.senderId) === user._id;
                return (
                  <div key={m._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-stripe-muted mb-1 px-1">
                      {isMine ? 'You' : (m.sender?.name || otherParty.name)}
                      {' · '}
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isMine ? '#635BFF' : '#ffffff',
                        color: isMine ? '#ffffff' : '#425466',
                        border: isMine ? 'none' : '1px solid #E6EBF1',
                        borderBottomRightRadius: isMine ? '4px' : '16px',
                        borderBottomLeftRadius:  !isMine ? '4px' : '16px',
                        boxShadow: isMine
                          ? '0 2px 8px rgba(99,91,255,0.3)'
                          : '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-stripe-border">
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  className="stripe-input flex-1 pr-12 py-3"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-2 p-1.5 bg-stripe-purple text-white rounded-lg disabled:opacity-40 hover:bg-[#524ae3] transition-colors"
                >
                  {sending
                    ? <Loader className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Order Summary ────────────────────── */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="stripe-card bg-white p-6">
              <h3 className="font-bold text-stripe-slate mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stripe-muted">Item price</span>
                  <span className="font-medium text-stripe-slate">₹{order.price?.toLocaleString()}</span>
                </div>
                {!isBuyer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stripe-muted">Platform fee</span>
                    <span className="font-medium text-stripe-slate">- ₹{order.platformFee?.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-stripe-border pt-3 flex justify-between font-bold text-stripe-slate">
                  <span>{isBuyer ? 'Total Paid' : 'Net Earnings'}</span>
                  <span>₹{(isBuyer ? order.price : order.sellerEarnings)?.toLocaleString()}</span>
                </div>
              </div>

              {order.status === 'pending_negotiation' && (
                <div className="mb-6 p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                  <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Negotiation Phase
                  </h4>
                  {isBuyer ? (
                    <div className="text-sm text-amber-700">
                      <p className="mb-4">Discuss the requirements in the chat. The seller will set the final price here.</p>
                      <button 
                        onClick={handlePayPendingOrder}
                        disabled={payLoading}
                        className="w-full btn-primary !bg-amber-600 hover:!bg-amber-700 disabled:opacity-60"
                      >
                        {payLoading ? <Loader className="h-4 w-4 animate-spin mx-auto" /> : `Pay Agreed Amount (₹${order.price})`}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-700">
                      <p className="mb-3">Once you agree on the requirements, set the final price below for the buyer to pay.</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold">₹</span>
                          <input 
                            type="number"
                            min={50}
                            className="stripe-input pl-7 !bg-white !border-amber-300"
                            placeholder="Enter amount"
                            value={negotiationPrice}
                            onChange={(e) => setNegotiationPrice(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleSetPrice}
                          disabled={updatingPrice || !negotiationPrice}
                          className="btn-primary shrink-0 !bg-amber-600 hover:!bg-amber-700 disabled:opacity-60 px-4 py-2 text-sm"
                        >
                          {updatingPrice ? <Loader className="h-4 w-4 animate-spin" /> : 'Lock Price'}
                        </button>
                      </div>
                      {priceSuccessMsg && (
                        <div className="mt-3 flex items-start gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs font-medium">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          {priceSuccessMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.requirements && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-stripe-muted uppercase tracking-wider mb-2">Requirements</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-stripe-slate whitespace-pre-wrap border border-slate-100">
                    {order.requirements}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {['pending', 'inProgress'].includes(order.status) && (
                  <div className="flex items-start gap-2 bg-stripe-purple/10 text-stripe-purple p-3 rounded-lg text-xs leading-relaxed">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    {isBuyer
                      ? 'Funds are held securely by Cosen. Released only when you approve.'
                      : 'Funds are in escrow. Deliver the work to receive payment.'}
                  </div>
                )}

                {!isBuyer && order.status === 'inProgress' && (
                  <button onClick={() => updateStatus('deliver')} className="btn-primary w-full justify-center">
                    Deliver Work Now
                  </button>
                )}

                {isBuyer && order.status === 'delivered' && (
                  <div className="space-y-2 border border-green-200 bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-green-800 mb-2">Seller marked this delivered.</p>
                    <button
                      onClick={() => updateStatus('complete')}
                      className="btn-primary w-full justify-center !bg-green-600 hover:!bg-green-700"
                    >
                      Approve &amp; Complete
                    </button>
                  </div>
                )}

                {order.status === 'completed' && !order.isReviewed && isBuyer && (
                  <div className="space-y-2 border border-blue-200 bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-blue-800 mb-2">How was your experience?</p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="btn-primary w-full justify-center !bg-blue-600 hover:!bg-blue-700"
                    >
                      Leave a Review
                    </button>
                  </div>
                )}

                {order.status === 'completed' && (!isBuyer || order.isReviewed) && (
                  <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                    <span className="font-semibold text-stripe-slate text-sm">Order Completed</span>
                    <span className="text-xs text-stripe-muted mt-1">Payment released.</span>
                    {order.isReviewed && !order.review && (
                      <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        <Star className="h-3.5 w-3.5 fill-amber-500" /> You reviewed this order
                      </span>
                    )}
                    {order.review && (
                      <div className="mt-4 w-full text-left bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-stripe-slate">{isBuyer ? 'Your Review' : 'Buyer\'s Review'}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < order.review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        {order.review.comment && (
                          <p className="text-xs text-stripe-steel italic border-l-2 border-stripe-purple/20 pl-2 py-0.5">"{order.review.comment}"</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp info card */}
            <div className="stripe-card bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg viewBox="0 0 24 24" fill={WA_GREEN} className="h-5 w-5 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-semibold text-stripe-slate text-sm">WhatsApp Chat</span>
              </div>
              {waLink ? (
                <p className="text-xs text-stripe-muted leading-relaxed">
                  The seller has a verified phone. Click the WhatsApp button in the chat header to connect directly.
                </p>
              ) : (
                <p className="text-xs text-stripe-muted leading-relaxed">
                  WhatsApp will be available once <strong>{isBuyer ? 'the seller' : 'you'}</strong> verify{isBuyer ? 's' : ''} a phone number in profile settings.
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-stripe-muted px-2">
              <Info className="h-4 w-4 shrink-0" />
              Do not pay outside the platform. Funds are protected under Cosen's escrow guarantee.
            </div>
          </div>

        </div>
      </div>

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-stripe-slate/40 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-bold text-stripe-slate mb-2">Leave a Review</h2>
            <p className="text-sm text-stripe-muted mb-6">How was your experience with {otherParty.name}?</p>

            <form onSubmit={handleReviewSubmit}>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110"
                    onClick={() => setReviewRating(star)}
                  >
                    <Star
                      className={`h-10 w-10 ${
                        reviewRating >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-stripe-slate mb-2">Comment (Optional)</label>
                <textarea
                  className="stripe-input w-full min-h-[100px] resize-none"
                  placeholder="What did you like about this service?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-outline flex-1 justify-center"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary flex-1 justify-center"
                >
                  {submittingReview ? <Loader className="h-5 w-5 animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
