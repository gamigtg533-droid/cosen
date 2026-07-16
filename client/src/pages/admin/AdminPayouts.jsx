import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, CheckCircle, Clock, Copy, Check,
  AlertTriangle, Loader, ChevronDown, ChevronUp
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import api from '../../lib/api';

// ── Toast helper ───────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all
      ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ── Copyable UPI ID ────────────────────────────────────────────
function CopyUPI({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} title="Click to copy"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-80"
      style={{ background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.2)', color: '#A5A1FF' }}>
      {value}
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Payout row ─────────────────────────────────────────────────
function PayoutRow({ payout, onMarkPaid, marking }) {
  const shortId = String(payout.order_id || '').slice(-8).toUpperCase();
  const sellerAvatar = payout.seller?.avatar_url;
  const sellerInitial = (payout.seller?.name || '?')[0].toUpperCase();

  return (
    <tr className="transition-colors hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Seller */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            {sellerAvatar
              ? <img src={sellerAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#635BFF,#00D4AA)' }}>{sellerInitial}</div>
            }
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs truncate max-w-[120px]">{payout.seller?.name}</p>
            <p className="text-[10px] truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{payout.seller?.email}</p>
          </div>
        </div>
      </td>
      {/* UPI */}
      <td className="px-4 py-3.5">
        {payout.upi_id && payout.upi_id !== 'NOT SET'
          ? <CopyUPI value={payout.upi_id} />
          : <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}>⚠️ Not Set</span>
        }
      </td>
      {/* Amount */}
      <td className="px-4 py-3.5">
        <span className="text-sm font-bold" style={{ color: '#00D4AA' }}>
          ₹{Number(payout.amount || 0).toLocaleString('en-IN')}
        </span>
      </td>
      {/* Service */}
      <td className="px-4 py-3.5">
        <p className="text-xs text-white/70 truncate max-w-[160px]">{payout.order?.service?.title || '—'}</p>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>#{shortId}</p>
      </td>
      {/* Date */}
      <td className="px-4 py-3.5">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {new Date(payout.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      {/* Action / Paid-at */}
      <td className="px-4 py-3.5">
        {payout.status === 'pending' ? (
          <button onClick={() => onMarkPaid(payout.id)} disabled={marking === payout.id}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#00B890)', color: '#fff' }}>
            {marking === payout.id
              ? <Loader className="w-3.5 h-3.5 animate-spin" />
              : <><CheckCircle className="w-3.5 h-3.5" /> Mark Paid</>
            }
          </button>
        ) : (
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: '#00D4AA' }}>
              <CheckCircle className="w-3.5 h-3.5" /> Paid
            </span>
            <span className="text-[10px] mt-0.5 block" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
            </span>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Table skeleton ─────────────────────────────────────────────
function TableSkeleton({ rows = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: j === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  ));
}

const COL_HEADERS = ['Seller', 'UPI ID', 'Amount', 'Service / Order', 'Created', 'Action'];

// ── Main component ─────────────────────────────────────────────
export default function AdminPayouts() {
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [marking, setMarking] = useState('');
  const [toast, setToast] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedType, setCompletedType] = useState('razorpay');

  const loadPending = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await api.get('/payouts/pending');
      setPending(res.data.payouts || []);
    } catch (e) { console.error(e); }
    finally { setLoadingP(false); }
  }, []);

  const loadCompleted = useCallback(async (type) => {
    setLoadingC(true);
    try {
      const res = await api.get(`/payouts/completed?type=${type}`);
      setCompleted(res.data.payouts || []);
    } catch (e) { console.error(e); }
    finally { setLoadingC(false); }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { if (showCompleted) loadCompleted(completedType); }, [showCompleted, completedType, loadCompleted]);

  const handleMarkPaid = async (payoutId) => {
    setMarking(payoutId);
    try {
      await api.patch(`/payouts/${payoutId}/mark-paid`);
      setPending(prev => prev.filter(p => p.id !== payoutId));
      setToast({ type: 'success', msg: '✅ Payout marked as paid. Email sent to seller.' });
      if (showCompleted) loadCompleted(completedType);
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Failed to mark as paid' });
    } finally { setMarking(''); }
  };

  const totalPending = pending.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>UPI Payouts</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Manual UPI transfers to sellers after order completion</p>
        </div>
        {!loadingP && pending.length > 0 && (
          <div className="px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Outstanding</p>
            <p className="text-xl font-bold" style={{ color: '#F87171' }}>₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>

      {/* ── Pending Payouts ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-sm font-bold text-white">Pending Payouts</h2>
          {!loadingP && (
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>
              {pending.length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {COL_HEADERS.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingP
                ? <TableSkeleton rows={3} />
                : pending.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      All caught up — no pending payouts!
                    </td></tr>
                  : pending.map(p => (
                      <PayoutRow key={p.id} payout={p} onMarkPaid={handleMarkPaid} marking={marking} />
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Completed Payouts (collapsible) ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: showCompleted ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
          onClick={() => setShowCompleted(v => !v)}>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <h2 className="text-sm font-bold text-white">Completed Payouts</h2>
          {showCompleted && !loadingC && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA' }}>
              {completed.length}
            </span>
          )}
          <div className="ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showCompleted && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setCompletedType('razorpay')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${completedType === 'razorpay' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                Payment by Cosen
              </button>
              <button onClick={() => setCompletedType('manual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${completedType === 'manual' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                Manual User UPI Payment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {COL_HEADERS.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingC
                    ? <TableSkeleton rows={3} />
                    : completed.length === 0
                      ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No completed payouts yet</td></tr>
                      : completed.map(p => (
                          <PayoutRow key={p.id} payout={p} onMarkPaid={() => {}} marking="" />
                        ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
