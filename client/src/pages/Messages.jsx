import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Send, Loader, MessageCircle, Search, ArrowLeft,
  Clock, Unlock, Lock, AlertCircle, Users, X, ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import LottieLoader from '../components/LottieLoader';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Messages() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  // active convo id may come from navigation state (Contact Seller flow)
  const [activeId,       setActiveId]       = useState(location.state?.conversationId || null);
  const [conversations,  setConversations]  = useState([]);
  const [messages,       setMessages]       = useState([]);
  const [newMsg,         setNewMsg]         = useState('');
  const [listLoading,    setListLoading]    = useState(true);
  const [msgLoading,     setMsgLoading]     = useState(false);
  const [sending,        setSending]        = useState(false);
  const [onlineUsers,    setOnlineUsers]    = useState(new Set());
  const [search,         setSearch]         = useState('');
  const [activeTab,      setActiveTab]      = useState('direct'); // 'direct' | 'sendiyou'
  const [mobileView,     setMobileView]     = useState('list'); // 'list' | 'chat'
  const [showMembers,    setShowMembers]    = useState(false); // members panel
  const [groupMembers,   setGroupMembers]   = useState([]); // [{id, alias, isRevealed, name, avatarUrl}]

  const socketRef    = useRef(null);
  const chatEndRef   = useRef(null);
  const inputRef     = useRef(null);

  // ── Active conversation object ──────────────────────────────
  const activeConvo = conversations.find(c => c.id === activeId) || null;

  // ── Load conversation list ──────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations || []);
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for active conversation ───────────────────
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }

    const load = async () => {
      setMsgLoading(true);
      try {
        const url = activeConvo?.type === 'sendiyou' 
          ? `/messages/order/${activeId}`
          : `/conversations/${activeId}/messages`;
        const { data } = await api.get(url);
        setMessages(data.messages || []);
        // Store group member list if SendiYou
        if (data.members) setGroupMembers(data.members);
        // Mark as read locally (remove unread badge)
        setConversations(prev =>
          prev.map(c => c.id === activeId ? { ...c, unreadCount: 0 } : c)
        );
      } catch {
        setMessages([]);
      } finally {
        setMsgLoading(false);
      }
    };
    load();
  }, [activeId]);

  // ── Socket.io ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('cosen_token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('connect',    () => {
      console.log('⚡ Socket connected successfully');
      // Register this user for presence tracking
      socket.emit('register_user', user._id);
      // Request current online users list
      socket.emit('get_online_users');
    });
    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error, falling back to polling/REST:', err.message);
    });

    // Listen for presence events
    socket.on('online_users_list', (ids) => {
      setOnlineUsers(new Set(ids));
    });
    socket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });
    socket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('receive_dm', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update last_message preview in sidebar + unread badge
      setConversations(prev =>
        prev.map(c =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                // only increment unread if this convo is NOT currently active
                unreadCount: msg.senderId !== user._id && msg.conversationId !== activeId
                  ? (c.unreadCount || 0) + 1
                  : c.unreadCount,
              }
            : c
        )
      );
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev =>
        prev.map(c =>
          c.id === msg.orderId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount: msg.senderId !== user._id && msg.orderId !== activeId
                  ? (c.unreadCount || 0) + 1
                  : c.unreadCount,
              }
            : c
        )
      );
    });

    return () => socket.disconnect();
  }, [user, activeId]);

  // ── Join/leave DM room on activeId change ───────────────────
  useEffect(() => {
    if (!activeId || !socketRef.current) return;
    if (activeConvo?.type === 'sendiyou') {
      socketRef.current.emit('join_order', activeId);
    } else {
      socketRef.current.emit('join_dm', activeId);
    }
  }, [activeId, activeConvo?.type]);

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMsg.trim();
    if (!content || sending || !activeId) return;
    setSending(true);
    setNewMsg('');
    inputRef.current?.focus();
    
    try {
      const url = activeConvo?.type === 'sendiyou' 
        ? `/messages/order/${activeId}`
        : `/conversations/${activeId}/messages`;
      const { data } = await api.post(url, { content });
      if (data.success && data.message) {
        setMessages(prev => {
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Failed to send DM message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Select conversation ─────────────────────────────────────
  const selectConvo = (id) => {
    setActiveId(id);
    setMobileView('chat');
  };

  const handleRevealToggle = async () => {
    try {
      const { data } = await api.put(`/sendiyou/order/${activeId}/reveal`);
      if (data.success) {
        loadConversations();
        // Re-fetch messages to refresh member list
        const { data: msgData } = await api.get(`/messages/order/${activeId}`);
        if (msgData.members) setGroupMembers(msgData.members);
      }
    } catch(err) {
      // ignore
    }
  };

  // ── Filtered conversations ──────────────────────────────────
  const baseFiltered = conversations.filter(c =>
    c.other?.name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const filtered = activeTab === 'direct'
    ? baseFiltered.filter(c => c.type !== 'sendiyou')
    : baseFiltered.filter(c => c.type === 'sendiyou');

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  // ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stripe-bg pt-20 pb-0">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 h-[calc(100vh-5rem)]">

        {/* Page title */}
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="h-6 w-6 text-stripe-purple" />
          <h1 className="font-display font-bold text-stripe-slate text-xl">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-stripe-purple text-white text-xs font-bold">
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        <div
          className="flex h-[calc(100%-3.5rem)] rounded-2xl overflow-hidden shadow-stripe-card border border-stripe-border bg-white"
          style={{ minHeight: 0 }}
        >

          {/* ── LEFT: Conversation List ── */}
          <div
            className={`
              w-full lg:w-80 shrink-0 border-r border-stripe-border flex flex-col
              ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
            `}
          >
            {/* Search & Tabs */}
            <div className="flex flex-col border-b border-stripe-border">
              <div className="p-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stripe-muted" />
                  <input
                    type="text"
                    placeholder="Search conversations…"
                    className="stripe-input pl-9 py-2 text-sm w-full"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center px-4 pb-3 gap-2">
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'direct'
                      ? 'bg-stripe-purple text-white shadow-sm'
                      : 'bg-slate-100 text-stripe-slate hover:bg-slate-200'
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => setActiveTab('sendiyou')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'sendiyou'
                      ? 'bg-stripe-purple text-white shadow-sm'
                      : 'bg-slate-100 text-stripe-slate hover:bg-slate-200'
                  }`}
                >
                  SendiYou
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stripe-border">
              {listLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LottieLoader size={80} text="Loading chats..." />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <MessageCircle className="h-10 w-10 text-stripe-muted opacity-30 mb-3" />
                  <p className="text-stripe-muted text-sm">
                    {search ? 'No matching conversations' : 'No messages yet. Contact a seller to start!'}
                  </p>
                  {!search && (
                    <button
                      onClick={() => navigate('/browse')}
                      className="mt-4 btn-primary py-2 px-4 text-sm"
                    >
                      Browse Services
                    </button>
                  )}
                </div>
              ) : (
                filtered.map(c => {
                  const initials = c.other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
                  return (
                  <button
                    key={c.id}
                    onClick={() => selectConvo(c.id)}
                    className={`
                      w-full text-left p-4 flex items-start gap-3 transition-colors
                      ${c.id === activeId
                        ? 'bg-stripe-purple/5 border-l-2 border-stripe-purple'
                        : 'hover:bg-slate-50/50 border-l-2 border-transparent'}
                    `}
                  >
                    {/* Avatar with real photo */}
                    {c.other?.avatarUrl ? (
                      <img
                        src={c.other.avatarUrl}
                        alt={c.other.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stripe-purple text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stripe-slate text-sm truncate">
                          {c.type === 'sendiyou' && <span title="SendiYou" className="mr-1">💌</span>}
                          {c.other?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-stripe-muted shrink-0 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-stripe-muted truncate">
                          {c.lastMessage || 'No messages yet'}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-stripe-purple text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );})
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat Window ── */}
          <div
            className={`
              flex-1 flex flex-col min-w-0
              ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
            `}
          >
            {!activeId ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 rounded-3xl bg-stripe-purple/10 flex items-center justify-center mb-6">
                  <MessageCircle className="h-10 w-10 text-stripe-purple" />
                </div>
                <h2 className="font-bold text-stripe-slate text-lg mb-2">Select a conversation</h2>
                <p className="text-stripe-muted text-sm max-w-xs">
                  Choose a conversation from the left, or contact a seller from any service page.
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-stripe-border bg-white flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    className="lg:hidden p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setMobileView('list')}
                  >
                    <ArrowLeft className="h-5 w-5 text-stripe-slate" />
                  </button>

                  {/* Avatar — clickable → profile */}
                  <Link
                    to={`/profile/${activeConvo?.other?._id}`}
                    className="relative shrink-0 group"
                    title={`View ${activeConvo?.other?.name}'s profile`}
                  >
                    {activeConvo?.other?.avatarUrl ? (
                      <img
                        src={activeConvo.other.avatarUrl}
                        alt={activeConvo.other.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-stripe-purple transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stripe-purple text-white flex items-center justify-center font-bold text-sm ring-2 ring-transparent group-hover:ring-stripe-purple transition-all">
                        {activeConvo?.other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                    )}
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: onlineUsers.has(activeConvo?.other?._id) ? '#22c55e' : '#94a3b8' }}
                    />
                  </Link>

                  {/* Name — for sendiyou make group name/count clickable to open panel */}
                  <div className="flex-1 min-w-0">
                    {activeConvo?.type === 'sendiyou' ? (
                      <button
                        onClick={() => setShowMembers(p => !p)}
                        className="font-semibold text-stripe-slate text-sm truncate hover:text-stripe-purple transition-colors block text-left w-full"
                      >
                        {activeConvo?.other?.name || '…'}
                      </button>
                    ) : (
                      <Link
                        to={`/profile/${activeConvo?.other?._id}`}
                        className="font-semibold text-stripe-slate text-sm truncate hover:text-stripe-purple transition-colors block"
                      >
                        {activeConvo?.other?.name || '…'}
                      </Link>
                    )}
                    <div className="text-xs text-stripe-muted flex items-center gap-2 mt-0.5">
                      {activeConvo?.type !== 'sendiyou' && (
                        <span>{onlineUsers.has(activeConvo?.other?._id) ? 'Online' : 'Offline'}</span>
                      )}
                      {activeConvo?.type === 'sendiyou' && (
                        <>
                          <button
                            onClick={() => setShowMembers(p => !p)}
                            className="flex items-center gap-1 font-medium bg-slate-100 hover:bg-stripe-purple/10 hover:text-stripe-purple px-1.5 rounded text-[10px] transition-colors cursor-pointer"
                          >
                            <Users className="w-2.5 h-2.5" />
                            {activeConvo.sendiyou?.joinedCount}/{activeConvo.sendiyou?.groupSize} members
                          </button>
                          {activeConvo.sendiyou?.isExpired && (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <AlertCircle className="w-3 h-3" /> Expired
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {activeConvo?.type === 'sendiyou' && (
                    <button
                      onClick={handleRevealToggle}
                      className={`
                        shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${activeConvo.sendiyou?.revealedIds?.includes(user?._id)
                          ? 'bg-stripe-purple/10 text-stripe-purple border border-stripe-purple/20 hover:bg-stripe-purple/20'
                          : 'bg-white text-stripe-slate border border-stripe-border shadow-sm hover:border-stripe-purple hover:text-stripe-purple'}
                      `}
                    >
                      {activeConvo.sendiyou?.revealedIds?.includes(user?._id) ? (
                        <><Unlock className="w-3 h-3" /> Revealed</>
                      ) : (
                        <><Lock className="w-3 h-3" /> Secret</>
                      )}
                    </button>
                  )}
                </div>

                {/* Messages area — with Members Panel overlay for SendiYou */}
                <div className="flex-1 overflow-hidden relative flex">
                  {/* Actual messages scroll area */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-slate-50/50">
                  {msgLoading ? (
                    <div className="flex justify-center py-10">
                      <LottieLoader size={80} text="Loading messages..." />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <MessageCircle className="h-8 w-8 text-stripe-muted opacity-30 mb-3" />
                      <p className="text-stripe-muted text-sm">
                        No messages yet. Say hello! 👋
                      </p>
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMine = (m.sender?._id || m.senderId) === user._id;
                      const senderId = m.sender?._id || m.senderId;
                      
                      // For SendiYou groups: use alias instead of real name
                      const isGroup = activeConvo?.type === 'sendiyou' && (activeConvo?.sendiyou?.groupSize || 1) > 1;
                      const memberAliases = activeConvo?.sendiyou?.memberAliases || {};
                      const revealedIds = activeConvo?.sendiyou?.revealedIds || [];
                      const senderAlias = isGroup ? (memberAliases[senderId] || '?') : null;
                      const senderIsRevealed = revealedIds.includes(senderId);

                      const senderName = isMine
                        ? `You${senderAlias ? ` (${senderAlias})` : ''}`
                        : isGroup
                          ? (senderIsRevealed && m.sender?.name)
                            ? `${m.sender.name} (${senderAlias})`
                            : senderAlias || m.sender?.name || activeConvo?.other?.name
                          : (m.sender?.name || activeConvo?.other?.name);

                      const senderAvatar = isMine
                        ? user.avatar?.url
                        : (senderIsRevealed || !isGroup)
                          ? (m.sender?.avatar?.url || m.sender?.avatarUrl || activeConvo?.other?.avatarUrl)
                          : null; // hidden if not revealed
                      const senderInitials = (senderAlias || senderName)?.slice(0, 2).toUpperCase() || '?';

                      return (
                        <div key={m._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                          {/* Avatar per bubble */}
                          {!isMine && (
                            <div className="shrink-0 mb-1">
                              {senderAvatar ? (
                                <img src={senderAvatar} alt={senderName}
                                  className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-stripe-purple text-white flex items-center justify-center text-[10px] font-bold">
                                  {senderInitials}
                                </div>
                              )}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            <div className="text-[10px] text-stripe-muted mb-1 px-1">
                              {senderName}
                              {' · '}
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-stripe-purple text-white shadow-[0_2px_8px_rgba(99,91,255,0.3)] rounded-br-sm border-none'
                                  : 'bg-white text-stripe-slate border border-stripe-border shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-bl-sm'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                  </div>

                  {/* Members Panel — slides in from right for SendiYou groups */}
                  {activeConvo?.type === 'sendiyou' && showMembers && (
                    <div className="w-64 shrink-0 border-l border-stripe-border bg-white flex flex-col shadow-lg">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-stripe-border">
                        <span className="font-bold text-stripe-slate text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-stripe-purple" /> Members
                        </span>
                        <button onClick={() => setShowMembers(false)} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                          <X className="w-4 h-4 text-stripe-muted" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-stripe-border">
                        {groupMembers.length === 0 ? (
                          <p className="text-stripe-muted text-xs text-center py-8">No members yet</p>
                        ) : groupMembers.map(member => (
                          <div key={member.id} className="px-4 py-3 flex items-center gap-3">
                            {/* Avatar circle — clickable if revealed */}
                            {member.isRevealed && member.id !== user?._id ? (
                              <Link to={`/profile/${member.id}`} className="shrink-0" title={`View ${member.name}'s profile`}>
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-stripe-purple/30 hover:ring-stripe-purple transition-all" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-stripe-purple/10 text-stripe-purple flex items-center justify-center font-bold text-sm ring-2 ring-stripe-purple/30 hover:ring-stripe-purple transition-all">
                                    {member.alias}
                                  </div>
                                )}
                              </Link>
                            ) : (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                member.id === user?._id
                                  ? 'bg-stripe-purple text-white'
                                  : 'bg-slate-100 text-stripe-slate'
                              }`}>
                                {member.alias}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-stripe-slate text-xs">
                                  {member.alias}
                                  {member.id === user?._id && <span className="text-stripe-muted font-normal"> (you)</span>}
                                </span>
                                {member.isRevealed ? (
                                  <Unlock className="w-3 h-3 text-green-500 shrink-0" />
                                ) : (
                                  <Lock className="w-3 h-3 text-stripe-muted shrink-0" />
                                )}
                              </div>
                              {member.isRevealed && member.name && (
                                <div className="text-[10px] text-stripe-muted truncate">{member.name}</div>
                              )}
                            </div>

                            {/* Profile link arrow for revealed members (not yourself) */}
                            {member.isRevealed && member.id !== user?._id && (
                              <Link to={`/profile/${member.id}`} title="View profile" className="shrink-0 text-stripe-muted hover:text-stripe-purple transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {activeConvo?.type === 'sendiyou' && activeConvo?.sendiyou?.isExpired ? (
                  <div className="p-4 bg-slate-50 border-t border-stripe-border text-center">
                    <p className="text-sm text-stripe-muted font-medium flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" /> This SendiYou connection has expired.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="p-4 bg-white border-t border-stripe-border">
                    <div className="relative flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        placeholder="Type a message…"
                        className="stripe-input flex-1 pr-12 py-3"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={!newMsg.trim() || sending}
                        className="absolute right-2 p-1.5 bg-stripe-purple text-white rounded-lg disabled:opacity-40 hover:bg-[#524ae3] transition-colors"
                      >
                        {sending
                          ? <Loader className="h-4 w-4 animate-spin" />
                          : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
