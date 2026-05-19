import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, Clock, RefreshCw, Shield, ChevronRight, MessageCircle, Loader, AlertCircle } from 'lucide-react';
import useRazorpay from '../hooks/useRazorpay';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const openCheckout = useRazorpay();

  const [service, setService]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState('');
  const [requirements, setRequirements] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ── Fetch service from API ──────────────────────────────
  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const { data } = await api.get(`/services/${id}`);
        if (data.success) {
          setService(data.service);
        } else {
          setFetchError('Service not found.');
        }
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load service. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchService();
  }, [id]);

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-stripe-purple" />
          <p className="text-stripe-muted text-sm">Loading service details…</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found state ─────────────────────────────
  if (fetchError || !service) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center px-4">
        <div className="stripe-card p-10 text-center max-w-sm w-full">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-stripe-slate text-xl mb-2">Service Not Found</h2>
          <p className="text-stripe-muted text-sm mb-6">{fetchError || 'This service does not exist or is no longer available.'}</p>
          <Link to="/browse" className="btn-primary justify-center w-full py-3">Browse Services</Link>
        </div>
      </div>
    );
  }

  // ── Negotiation handler ─────────────────────────────────
  const handleRequestNegotiation = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPayLoading(true);
    setPayError('');

    try {
      const { data } = await api.post('/orders', {
        serviceId: service._id || service.id,
        requirements: requirements.trim(),
      });

      if (data.success) {
        navigate(`/orders/${data.order._id || data.order.id}`);
      } else {
        setPayError(data.message || 'Could not request service.');
      }
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to request service.');
    } finally {
      setPayLoading(false);
    }
  };

  // ── Payment handler ─────────────────────────────────────
  const handleOrderNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPayLoading(true);
    setPayError('');

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await api.post('/payments/create-order', {
        serviceId:    service._id || service.id,
        requirements: requirements.trim(),
      });

      if (!data.success) {
        setPayError(data.message || 'Could not initiate payment.');
        setPayLoading(false);
        return;
      }

      setPayLoading(false);

      // Step 2: Open Razorpay checkout popup
      openCheckout({
        options: {
          key:         data.keyId,
          amount:      data.amount,
          currency:    data.currency,
          order_id:    data.razorpayOrderId,
          name:        'Cosen Marketplace',
          description: data.serviceTitle,
          image:       '/logo.png',
          prefill: {
            name:  user.name,
            email: user.email,
          },
          notes: { serviceId: service._id || service.id },
        },

        // Step 3: Verify payment on backend → create DB order
        onSuccess: async (response) => {
          setPayLoading(true);
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              serviceId:           service._id || service.id,
              requirements:        requirements.trim(),
            });

            if (verifyRes.data.success) {
              navigate('/payment-success', {
                state: { order: verifyRes.data.order, paymentId: response.razorpay_payment_id },
              });
            } else {
              setPayError('Payment made but verification failed. Please contact support.');
            }
          } catch {
            setPayError('Payment made but verification failed. Please contact support.');
          } finally {
            setPayLoading(false);
          }
        },

        onDismiss: () => {
          setPayLoading(false);
          setPayError('Payment was cancelled. You have not been charged.');
        },
      });
    } catch (err) {
      setPayLoading(false);
      setPayError(err.response?.data?.message || 'Payment initiation failed. Please try again.');
    }
  };
  const sellerId      = service.seller?._id;
  const sellerAvatar  = service.seller?.avatar?.url;
  const sellerInitials = service.seller?.name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Breadcrumb */}
      <div className="bg-stripe-bg border-b border-stripe-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-stripe-muted">
          <Link to="/browse" className="hover:text-stripe-purple transition-colors">Browse</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-stripe-purple font-medium">{service.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-stripe-slate font-medium truncate">{service.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left: Service Details ── */}
          <div className="flex-1 min-w-0">
            {/* Category + Rating */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-stripe-purple/10 text-stripe-purple">
                {service.category}
              </span>
              {service.subCategory && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {service.subCategory}
                </span>
              )}
              {service.rating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {[...Array(Math.round(service.rating))].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="font-semibold text-stripe-slate ml-1">{service.rating}</span>
                  <span className="text-stripe-muted">({service.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>

            <h1 className="font-display font-bold text-stripe-slate text-3xl lg:text-4xl mb-6 leading-tight">
              {service.title}
            </h1>

            {/* Image / Banner — click avatar or name to go to profile */}
            <div className="w-full h-72 rounded-2xl flex items-center justify-center mb-8 overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #635BFF20, #635BFF60)' }}>

              {/* Seller avatar (clickable) */}
              <Link to={`/profile/${sellerId}`} className="group" title={`View ${service.seller?.name}'s profile`}>
                {sellerAvatar ? (
                  <img
                    src={sellerAvatar}
                    alt={service.seller?.name}
                    className="w-24 h-24 rounded-3xl object-cover shadow-stripe-card ring-4 ring-white/60 group-hover:ring-stripe-purple/60 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-stripe-purple flex items-center justify-center text-white text-4xl font-bold shadow-stripe-card ring-4 ring-white/60 group-hover:ring-stripe-purple/60 transition-all">
                    {sellerInitials}
                  </div>
                )}
              </Link>

              {/* Seller name chip (clickable) */}
              <Link
                to={`/profile/${sellerId}`}
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-stripe-card-sm hover:bg-white transition-colors"
              >
                <p className="text-xs text-stripe-muted">{service.category}</p>
                <p className="text-sm font-semibold text-stripe-purple">{service.seller?.name || 'Campus Expert'}</p>
              </Link>
            </div>

            {/* Description */}
            <h2 className="font-bold text-stripe-slate text-xl mb-3">About This Service</h2>
            <p className="text-stripe-steel leading-relaxed mb-10 whitespace-pre-wrap">{service.description}</p>

            {/* Portfolio / Past Work Samples (Art & Design) */}
            {service.portfolioImages?.length > 0 && (
              <div className="mb-10">
                <h2 className="font-bold text-stripe-slate text-xl mb-1">Past Work Samples</h2>
                <p className="text-sm text-stripe-muted mb-4">Examples of previous work by this seller</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {service.portfolioImages.map((url, idx) => {
                    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                    return (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                        className="group relative block rounded-xl overflow-hidden border border-stripe-border aspect-video hover:shadow-lg transition-shadow">
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" controls={false} muted loop playsInline autoPlay />
                        ) : (
                          <img src={url} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded-full">View full</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {service.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10">
                {service.tags.map(tag => (
                  <span key={tag}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#635BFF15', color: '#635BFF' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}


            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Clock,     label: `${service.deliveryDays}-day delivery` },
                { icon: RefreshCw, label: '3 revisions' },
                { icon: Shield,    label: 'Escrow protected' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="stripe-card p-4 flex flex-col items-center text-center gap-2">
                  <Icon className="h-5 w-5 text-stripe-purple" />
                  <span className="text-sm font-medium text-stripe-steel">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Order Sidebar ── */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="stripe-card p-6 sticky top-24">
              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-stripe-slate">
                  ₹{Number(service.price).toLocaleString('en-IN')}
                </span>
                <span className="text-stripe-muted">/ session</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-stripe-muted text-sm">
                  {service.deliveryDays}-day delivery · 3 revisions included
                </p>
                {service.isNegotiable && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                    Negotiable
                  </span>
                )}
              </div>

              {/* Own service warning */}
              {user && (user._id === service.sellerId || user.id === service.sellerId) && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2.5 mb-4 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  This is your own service — you cannot order it.
                </div>
              )}

              {/* Requirements input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-stripe-slate mb-1.5">
                  Your requirements <span className="text-stripe-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="service-requirements"
                  rows={3}
                  className="stripe-input resize-none"
                  placeholder="Describe what you need help with..."
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                />
              </div>

              {/* Error */}
              {payError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-4 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {payError}
                </div>
              )}

              {/* CTA Button */}
              {service.isNegotiable ? (
                <button
                  id="service-negotiate"
                  onClick={handleRequestNegotiation}
                  disabled={payLoading || (user && (user._id === service.sellerId || user.id === service.sellerId))}
                  className="btn-primary w-full justify-center py-3.5 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {payLoading ? <><Loader className="h-4 w-4 animate-spin" /> Processing...</> : 'Request Service & Negotiate'}
                </button>
              ) : (
                <button
                  id="service-order-now"
                  onClick={handleOrderNow}
                  disabled={payLoading || (user && (user._id === service.sellerId || user.id === service.sellerId))}
                  className="btn-primary w-full justify-center py-3.5 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {payLoading
                    ? <><Loader className="h-4 w-4 animate-spin" /> Processing...</>
                    : <>Pay ₹{Number(service.price).toLocaleString('en-IN')} with Razorpay <ChevronRight className="h-4 w-4" /></>
                  }
                </button>
              )}

              <button
                id="service-contact"
                className="btn-outline w-full justify-center py-3 gap-2"
                disabled={chatLoading}
                onClick={async () => {
                  if (!user) { navigate('/login'); return; }
                  setChatLoading(true);
                  try {
                    const sellerId = service.seller?._id || service.sellerId;
                    const { data } = await api.post('/conversations/start', { recipientId: sellerId });
                    navigate('/messages', { state: { conversationId: data.conversation.id } });
                  } catch {
                    navigate('/messages');
                  } finally {
                    setChatLoading(false);
                  }
                }}
              >
                {chatLoading
                  ? <><Loader className="h-4 w-4 animate-spin" /> Opening chat…</>
                  : <><MessageCircle className="h-4 w-4" /> Contact Seller</>}
              </button>

              {/* Escrow note */}
              <div className="flex items-center gap-2 justify-center mt-4 text-xs text-stripe-muted">
                <Shield className="h-3.5 w-3.5 text-stripe-purple" />
                Funds held securely until you confirm delivery
              </div>

              {/* Razorpay badge */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-xs text-stripe-muted">Secured by</span>
                <span className="text-xs font-bold" style={{ color: '#072654' }}>Razorpay</span>
              </div>

              <hr className="border-stripe-border my-6" />

              {/* Seller info */}
              {service.seller && (
                <>
                  <h4 className="font-semibold text-stripe-slate mb-3 text-sm">About the Seller</h4>
                  <div className="flex items-center gap-3 mb-4">

                    {/* Avatar — clickable */}
                    <Link to={`/profile/${sellerId}`} className="shrink-0 group" title="View profile">
                      {sellerAvatar ? (
                        <img
                          src={sellerAvatar}
                          alt={service.seller.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-stripe-purple transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-stripe-purple flex items-center justify-center text-white font-bold ring-2 ring-transparent group-hover:ring-stripe-purple transition-all">
                          {sellerInitials}
                        </div>
                      )}
                    </Link>

                    <div>
                      {/* Name — clickable */}
                      <Link
                        to={`/profile/${sellerId}`}
                        className="font-semibold text-stripe-slate hover:text-stripe-purple transition-colors"
                      >
                        {service.seller.name}
                      </Link>
                      <div className="text-xs text-stripe-muted">
                        {service.seller.department}
                        {service.seller.yearOfStudy ? ` · ${service.seller.yearOfStudy}` : ''}
                      </div>
                      {service.seller.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-stripe-slate">{service.seller.rating}</span>
                          <span className="text-xs text-stripe-muted">· {service.seller.reviewCount} orders</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/profile/${sellerId}`}
                    id="view-seller-profile"
                    className="btn-ghost text-sm justify-center w-full"
                  >
                    View full profile <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
