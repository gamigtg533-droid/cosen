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
    res.json({ success: true, conversations });
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
    res.json({ success: true, count: count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, count: 0 });
  }
});

module.exports = router;
