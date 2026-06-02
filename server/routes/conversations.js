const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { supabase } = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────

/**
 * Ensures participant_a < participant_b so the UNIQUE constraint
 * never cares about who "started" the conversation.
 */
const ordered = (idA, idB) =>
  idA < idB ? [idA, idB] : [idB, idA];

const mapConvo = (row, myId) => {
  if (!row) return null;
  const isA = row.participant_a === myId;
  const other = isA ? row.user_b : row.user_a;
  return {
    id: row.id,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    other: other
      ? { _id: other.id, name: other.name, avatarUrl: other.avatar_url }
      : null,
    unreadCount: row.unread_count ?? 0,
  };
};

const mapDM = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    read: row.read,
    createdAt: row.created_at,
    sender: row.sender
      ? { _id: row.sender.id, name: row.sender.name, avatarUrl: row.sender.avatar_url }
      : undefined,
  };
};


// ─────────────────────────────────────────────────────────────
// GET /api/conversations — list all conversations for current user
// ─────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const { data: rows, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user_a:users!participant_a(id, name, avatar_url),
        user_b:users!participant_b(id, name, avatar_url)
      `)
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Attach unread counts per conversation
    const ids = rows.map(r => r.id);
    let unreadMap = {};
    if (ids.length) {
      const { data: unreadRows } = await supabase
        .from('direct_messages')
        .select('conversation_id')
        .in('conversation_id', ids)
        .neq('sender_id', userId)
        .eq('read', false);

      (unreadRows || []).forEach(r => {
        unreadMap[r.conversation_id] = (unreadMap[r.conversation_id] || 0) + 1;
      });
    }

    const conversations = rows.map(r => mapConvo({ ...r, unread_count: unreadMap[r.id] || 0 }, userId));

    // --- FETCH SENDIYOU ORDERS ---
    const sendiFields = `
      id, created_at, status, revealed_ids, buyer_ids, buyer_id, seller_id,
      service:services!inner(category, display_name, expires_at, group_size),
      buyer:users!buyer_id(id, name, avatar_url),
      seller:users!seller_id(id, name, avatar_url)
    `;

    const [directRes, groupRes] = await Promise.all([
      supabase.from('orders').select(sendiFields).eq('service.category', 'SendiYou').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from('orders').select(sendiFields).eq('service.category', 'SendiYou').contains('buyer_ids', [userId])
    ]);

    const allSendi = [...(directRes.data || []), ...(groupRes.data || [])].filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i);
    const sendiOrderIds = allSendi.map(o => o.id);

    let sendiConversations = [];
    if (sendiOrderIds.length > 0) {
      const [unreadRes, msgsRes] = await Promise.all([
        supabase.from('messages').select('order_id').in('order_id', sendiOrderIds).neq('sender_id', userId).eq('read', false),
        supabase.from('messages').select('order_id, content, created_at').in('order_id', sendiOrderIds).order('created_at', { ascending: false })
      ]);

      let sendiUnread = {};
      (unreadRes.data || []).forEach(r => {
        sendiUnread[r.order_id] = (sendiUnread[r.order_id] || 0) + 1;
      });

      let latestMsgs = {};
      (msgsRes.data || []).forEach(m => {
        if (!latestMsgs[m.order_id]) latestMsgs[m.order_id] = m;
      });

      sendiConversations = allSendi.map(o => {
        const isRevealed = (o.revealed_ids || []).includes(userId);
        const lastMsg = latestMsgs[o.id];
        const isGroup = o.service?.group_size > 1;

        let otherName = 'SendiYou Connection';
        let otherAvatar = '';

        if (isGroup) {
          otherName = 'SendiYou Group';
        } else {
          const other = o.buyer_id === userId ? o.seller : o.buyer;
          if (other) {
            // If they haven't revealed, mask it
            const otherRevealed = (o.revealed_ids || []).includes(other.id);
            if (otherRevealed || isRevealed) { // Reveal logic: if either revealed (based on recent fix) it's visible. Actually, independent reveal means if OTHER revealed, I can see them.
              otherName = otherRevealed ? other.name : (o.service?.display_name || 'Secret');
              otherAvatar = otherRevealed ? other.avatar_url : '';
            } else {
              otherName = o.service?.display_name || 'Secret';
            }
          }
        }

        return {
          id: o.id,
          type: 'sendiyou',
          lastMessage: lastMsg ? lastMsg.content : (o.buyer_ids?.length > 1 ? 'Someone joined the group.' : 'Connection accepted!'),
          lastMessageAt: lastMsg ? lastMsg.created_at : o.created_at,
          createdAt: o.created_at,
          other: { name: otherName, avatarUrl: otherAvatar },
          unreadCount: sendiUnread[o.id] || 0,
          sendiyou: {
            isExpired: o.service?.expires_at ? new Date(o.service.expires_at) < new Date() : false,
            expiresAt: o.service?.expires_at,
            groupSize: o.service?.group_size || 1,
            joinedCount: o.buyer_ids?.length || 1,
            revealedIds: o.revealed_ids || []
          }
        };
      });
    }

    const merged = [...conversations, ...sendiConversations].sort((a, b) => 
      new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
    );

    res.json({ success: true, conversations: merged });
  } catch (err) {
    console.error('GET /conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/conversations/start — create or fetch exiting convo
// body: { recipientId }
// ─────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (!recipientId) return res.status(400).json({ success: false, message: 'recipientId required' });
    if (recipientId === userId) return res.status(400).json({ success: false, message: 'Cannot message yourself' });

    // Verify recipient exists
    const { data: recipient } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .eq('id', recipientId)
      .maybeSingle();
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const [pA, pB] = ordered(userId, recipientId);

    // Try to find existing conversation
    let { data: convo } = await supabase
      .from('conversations')
      .select(`
        *,
        user_a:users!participant_a(id, name, avatar_url),
        user_b:users!participant_b(id, name, avatar_url)
      `)
      .eq('participant_a', pA)
      .eq('participant_b', pB)
      .maybeSingle();

    if (!convo) {
      // Create new
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ participant_a: pA, participant_b: pB })
        .select(`
          *,
          user_a:users!participant_a(id, name, avatar_url),
          user_b:users!participant_b(id, name, avatar_url)
        `)
        .single();
      if (error) throw error;
      convo = created;
    }

    res.json({ success: true, conversation: mapConvo(convo, userId) });
  } catch (err) {
    console.error('POST /conversations/start error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/conversations/:id/messages — fetch messages
// ─────────────────────────────────────────────────────────────
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Verify access
    const { data: convo } = await supabase
      .from('conversations')
      .select('id, participant_a, participant_b')
      .eq('id', id)
      .maybeSingle();

    if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (convo.participant_a !== userId && convo.participant_b !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*, sender:users!sender_id(id, name, avatar_url)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark unread messages as read
    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('read', false);

    res.json({ success: true, messages: messages.map(mapDM) });
  } catch (err) {
    console.error('GET /conversations/:id/messages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/conversations/:id/messages — send a message (REST fallback)
// ─────────────────────────────────────────────────────────────
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });

    const { data: convo } = await supabase
      .from('conversations')
      .select('id, participant_a, participant_b')
      .eq('id', id)
      .maybeSingle();

    if (!convo) return res.status(404).json({ success: false, message: 'Not found' });
    if (convo.participant_a !== userId && convo.participant_b !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { data: msg, error } = await supabase
      .from('direct_messages')
      .insert({ conversation_id: id, sender_id: userId, content: content.trim() })
      .select('*, sender:users!sender_id(id, name, avatar_url)')
      .single();

    if (error) throw error;

    // Update conversation preview
    await supabase
      .from('conversations')
      .update({ last_message: content.trim(), last_message_at: new Date().toISOString() })
      .eq('id', id);

    const mapped = mapDM(msg);

    // Broadcast message to socket room in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`dm_${id}`).emit('receive_dm', mapped);
    }

    res.status(201).json({ success: true, message: mapped });
  } catch (err) {
    console.error('POST /conversations/:id/messages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/conversations/unread-count — total unread for badge
// ─────────────────────────────────────────────────────────────
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversation ids the user is part of
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

    if (!convos?.length) return res.json({ success: true, count: 0 });

    const ids = convos.map(c => c.id);
    const { count, error } = await supabase
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw error;
    let totalCount = count || 0;

    // SendiYou unread count
    const [directRes, groupRes] = await Promise.all([
      supabase.from('orders').select('id, service:services!inner(category)').eq('service.category', 'SendiYou').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from('orders').select('id, service:services!inner(category)').eq('service.category', 'SendiYou').contains('buyer_ids', [userId])
    ]);
    const allSendi = [...(directRes.data || []), ...(groupRes.data || [])].filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i);
    const sendiOrderIds = allSendi.map(o => o.id);

    if (sendiOrderIds.length > 0) {
      const { count: sCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('order_id', sendiOrderIds)
        .neq('sender_id', userId)
        .eq('read', false);
      
      if (sCount) totalCount += sCount;
    }

    res.json({ success: true, count: totalCount });
  } catch (err) {
    res.status(500).json({ success: false, count: 0 });
  }
});

module.exports = router;
