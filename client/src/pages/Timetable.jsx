import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Calendar } from 'lucide-react';
import api from '../lib/api';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };
const SESSION_COLORS = {
  Lecture:  { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', dot: '#635BFF' },
  Tutorial: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#22C55E' },
  Lab:      { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', dot: '#F97316' },
};
const STATUS_CONFIG = {
  occupied:   { label: 'In Use', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: XCircle },
  busy_soon:  { label: 'Free (busy soon)', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: AlertCircle },
  free:       { label: 'Free Now', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0', icon: CheckCircle },
};

// Building display names
const BUILDING_NAMES = {
  B: 'Block B', BX: 'Block BX', C: 'Block C', CX: 'Block CX',
  G: 'Block G', H: 'Block H', I: 'Block I', 'Music Room': 'Music Room',
};

function getCurrentDayAndTime() {
  const now = new Date();
  const dayIdx = now.getDay(); // 0=Sun
  const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = dayMap[dayIdx];
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return { day: DAYS.includes(day) ? day : 'MON', time: `${hours}:${mins}` };
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function RoomCard({ room, expanded, onToggle }) {
  const status = STATUS_CONFIG[room.status] || STATUS_CONFIG.free;
  const StatusIcon = status.icon;
  const sess = room.current || room.next;

  return (
    <div
      style={{
        background: '#fff',
        border: `1.5px solid ${expanded ? '#635BFF' : '#E2E8F0'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: expanded ? '0 4px 24px rgba(99,91,255,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Room Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: status.color, flexShrink: 0,
          boxShadow: `0 0 0 3px ${status.bg}`,
        }} />

        {/* Room code */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{room.room}</span>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
              background: status.bg, color: status.color, border: `1px solid ${status.border}`,
            }}>
              <StatusIcon style={{ width: 10, height: 10, display: 'inline', marginRight: 3 }} />
              {status.label}
            </span>
          </div>

          {/* Current / next class info */}
          {room.status === 'occupied' && room.current && (
            <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{room.current.subject}</span>
              {' · '}{room.current.sessionType}{' · '}{room.current.teacher}
              {' · '}ends <span style={{ fontWeight: 600 }}>{room.current.endTime}</span>
            </p>
          )}
          {room.status === 'busy_soon' && room.next && (
            <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
              Next: <span style={{ fontWeight: 600, color: '#0F172A' }}>{room.next.subject}</span>
              {' '}at <span style={{ fontWeight: 600 }}>{room.next.startTime}</span>
            </p>
          )}
          {room.status === 'free' && !room.next && (
            <p style={{ fontSize: '12px', color: '#10B981', margin: '3px 0 0', fontWeight: 500 }}>Free for the rest of the day</p>
          )}
          {room.status === 'free' && room.next && (
            <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
              Next class at <span style={{ fontWeight: 600, color: '#0F172A' }}>{room.next.startTime}</span>
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div style={{ flexShrink: 0, color: '#94A3B8' }}>
          {expanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
        </div>
      </button>

      {/* Expanded: Full day schedule */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '1rem 1.25rem' }}>
          {room.todaySlots.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>No classes scheduled today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {room.todaySlots.map((slot, i) => {
                const sc = SESSION_COLORS[slot.sessionType] || SESSION_COLORS.Lecture;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.625rem 0.875rem', borderRadius: '10px',
                    background: sc.bg, border: `1px solid ${sc.border}`,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: sc.text }}>{slot.startTime}</span>
                      <div style={{ width: 1, height: 12, background: sc.border, margin: '2px 0' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sc.text, opacity: 0.7 }}>{slot.endTime}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{slot.subject}</span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '100px',
                          background: sc.border, color: sc.text
                        }}>{slot.sessionType}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                        {slot.teacher} · {slot.classCode}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Timetable() {
  const { day: todayDay, time: currentTime } = getCurrentDayAndTime();

  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | free | occupied
  const timerRef = useRef(null);

  // Load buildings on mount
  useEffect(() => {
    api.get('/timetable/buildings').then(r => {
      setBuildings(r.data.buildings || []);
      if (r.data.buildings?.length > 0) setSelectedBuilding(r.data.buildings[0]);
    }).catch(() => setError('Failed to load buildings')).finally(() => setLoadingBuildings(false));

    api.get('/timetable/meta').then(r => setMeta(r.data.meta)).catch(() => {});
  }, []);

  // Auto-update time every 60s
  useEffect(() => {
    if (!useCurrentTime) return;
    timerRef.current = setInterval(() => {
      const { time } = getCurrentDayAndTime();
      setSelectedTime(time);
    }, 60000);
    return () => clearInterval(timerRef.current);
  }, [useCurrentTime]);

  // Fetch rooms whenever params change — only when building is actually selected
  useEffect(() => {
    if (!selectedBuilding || buildings.length === 0) return;
    fetchRooms();
  }, [selectedBuilding, selectedDay, selectedTime]);

  async function fetchRooms() {
    if (!selectedBuilding) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/timetable/rooms', {
        params: { building: selectedBuilding, day: selectedDay, time: selectedTime },
      });
      setRooms(data.rooms || []);
      setExpandedRooms({});
    } catch (err) {
      // Don't show generic API error if no data is loaded yet
      const msg = err.response?.data?.message || 'Failed to load room data';
      if (msg !== 'building, day, and time are required') setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleRoom(room) {
    setExpandedRooms(prev => ({ ...prev, [room]: !prev[room] }));
  }

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (filter === 'free') return r.status === 'free' || r.status === 'busy_soon';
    if (filter === 'occupied') return r.status === 'occupied';
    return true;
  });

  const stats = {
    total: rooms.length,
    free: rooms.filter(r => r.status === 'free').length,
    busySoon: rooms.filter(r => r.status === 'busy_soon').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ background: '#060C20', padding: '2.5rem clamp(1rem,5vw,4rem) 2rem', paddingTop: 'calc(64px + 2rem)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,91,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: 18, height: 18, color: '#A5A1FF' }} />
            </div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,1.8rem)', color: '#fff', margin: 0 }}>
              Free Room Finder
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(0,212,170,0.15)', color: '#00D4AA', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(0,212,170,0.25)' }}>
              BETA
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
            PPSU SOE · {meta ? meta.semester_label : 'Timetable 2026-2027'} · Find which classrooms are free right now
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem clamp(1rem,5vw,4rem) 4rem' }}>

        {/* Controls Card */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          {/* Building selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.625rem' }}>
              Building
            </label>
            {loadingBuildings ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ width: 76, height: 38, borderRadius: 10, background: '#F1F5F9', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : buildings.length === 0 ? (
              /* No timetable data loaded yet */
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#92400E', margin: '0 0 4px' }}>Timetable data not loaded yet</p>
                  <p style={{ fontSize: 13, color: '#B45309', margin: 0, lineHeight: 1.5 }}>
                    An admin needs to:
                    <br />1. Run the SQL migration in Supabase
                    <br />2. Upload the timetable Excel file from the <strong>Admin Panel → Timetable</strong> section
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {buildings.map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBuilding(b)}
                    style={{
                      padding: '0.5rem 1.125rem', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      border: selectedBuilding === b ? '2px solid #635BFF' : '1.5px solid #E2E8F0',
                      background: selectedBuilding === b ? '#635BFF' : '#fff',
                      color: selectedBuilding === b ? '#fff' : '#475569',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {BUILDING_NAMES[b] || b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Day + Time row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Day */}
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>
                Day
              </label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {DAYS.map(d => (
                  <button key={d}
                    onClick={() => setSelectedDay(d)}
                    style={{
                      padding: '0.375rem 0.75rem', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: selectedDay === d ? '2px solid #635BFF' : '1.5px solid #E2E8F0',
                      background: selectedDay === d ? '#EEF2FF' : '#F8FAFC',
                      color: selectedDay === d ? '#4338CA' : '#94A3B8',
                      cursor: 'pointer',
                      ...(d === todayDay && selectedDay !== d ? { borderColor: '#CBD5E1', color: '#64748B' } : {}),
                    }}
                  >
                    {d}
                    {d === todayDay && <span style={{ fontSize: 8, marginLeft: 3, color: '#10B981' }}>●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ flex: '0 0 auto' }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>
                Time
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={e => { setSelectedTime(e.target.value); setUseCurrentTime(false); }}
                  style={{
                    padding: '0.5rem 0.875rem', borderRadius: 10, border: '1.5px solid #E2E8F0',
                    fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC',
                    outline: 'none', cursor: 'pointer',
                  }}
                />
                <button
                  onClick={() => { const { time } = getCurrentDayAndTime(); setSelectedTime(time); setUseCurrentTime(true); }}
                  title="Use current time"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '0.5rem 0.875rem',
                    borderRadius: 10, border: useCurrentTime ? '1.5px solid #635BFF' : '1.5px solid #E2E8F0',
                    background: useCurrentTime ? '#EEF2FF' : '#F8FAFC', color: useCurrentTime ? '#4338CA' : '#94A3B8',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  <Clock style={{ width: 13, height: 13 }} />
                  Now
                </button>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchRooms}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.125rem',
                borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats + Filter */}
        {rooms.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* Stats pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              {[
                { key: 'all', label: `All Rooms (${stats.total})`, color: '#635BFF', bg: '#EEF2FF' },
                { key: 'free', label: `Free (${stats.free + stats.busySoon})`, color: '#10B981', bg: '#F0FDF4' },
                { key: 'occupied', label: `Occupied (${stats.occupied})`, color: '#EF4444', bg: '#FEF2F2' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    padding: '0.375rem 0.875rem', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    border: filter === f.key ? `1.5px solid ${f.color}` : '1.5px solid #E2E8F0',
                    background: filter === f.key ? f.bg : '#fff',
                    color: filter === f.key ? f.color : '#94A3B8',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {BUILDING_NAMES[selectedBuilding] || selectedBuilding} · {DAY_LABELS[selectedDay]} · {selectedTime}
            </span>
          </div>
        )}

        {/* Error — only show for real fetch errors, not setup errors */}
        {error && buildings.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: '1rem', color: '#EF4444', fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 16, background: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {/* Room list */}
        {!loading && filteredRooms.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filteredRooms.map(room => (
              <RoomCard
                key={room.room}
                room={room}
                expanded={!!expandedRooms[room.room]}
                onToggle={() => toggleRoom(room.room)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredRooms.length === 0 && rooms.length === 0 && !error && selectedBuilding && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Building2 style={{ width: 40, height: 40, color: '#CBD5E1', margin: '0 auto 1rem' }} />
            <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 15 }}>No rooms found for {BUILDING_NAMES[selectedBuilding] || selectedBuilding}</p>
            <p style={{ color: '#CBD5E1', fontSize: 13, marginTop: 4 }}>The timetable data may not include this building for {DAY_LABELS[selectedDay]}</p>
          </div>
        )}

        {!loading && filteredRooms.length === 0 && rooms.length > 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: '#94A3B8', fontSize: 14 }}>No rooms match this filter.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes spin  { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
