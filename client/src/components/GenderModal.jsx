import { useState } from 'react';
import { Loader, Heart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

const GENDERS = [
  { value: 'Male',              emoji: '👨', label: 'Male' },
  { value: 'Female',            emoji: '👩', label: 'Female' },
  { value: 'Other',             emoji: '🌈', label: 'Other' },
  { value: 'Prefer not to say', emoji: '🔒', label: 'Prefer not to say' },
];

export default function GenderModal() {
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.gender) return null;

  const handleSave = async () => {
    if (!selected) { setError('Please select a gender to continue.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/users/me', { gender: selected });
      if (data.success) {
        setUser({ ...user, gender: selected });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stripe-slate/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="h-8 w-8 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-stripe-slate mb-1">One Quick Step!</h2>
          <p className="text-sm text-stripe-muted leading-relaxed">
            Tell us your gender to personalise your Cosen experience and unlock the <strong>SendiYou</strong> feature.
          </p>
        </div>

        {/* Gender Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {GENDERS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => { setSelected(value); setError(''); }}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-105 ${
                selected === value
                  ? 'border-pink-400 bg-pink-50 shadow-md shadow-pink-100'
                  : 'border-slate-200 bg-slate-50 hover:border-pink-200'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={`text-xs font-semibold ${selected === value ? 'text-pink-600' : 'text-stripe-steel'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !selected}
          className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: selected ? 'linear-gradient(135deg,#ec4899,#f43f5e)' : '#cbd5e1' }}
        >
          {saving ? <Loader className="h-4 w-4 animate-spin" /> : '💾 Save & Continue'}
        </button>

        <p className="text-[10px] text-stripe-muted text-center mt-3 leading-relaxed">
          This is used only for matching purposes and privacy filtering. You can change it in Profile Settings.
        </p>
      </div>
    </div>
  );
}
