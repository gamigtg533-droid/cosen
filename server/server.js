require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');


// ── Connect to Supabase ──────────────────────────────────────
connectDB();

const app = express();

// ── Allowed Origins ──────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  // Production frontend
  'https://cosen.online',
  'https://www.cosen.online',
  'https://api.cosen.online',
];

// Support a comma-separated CLIENT_URL env variable for extra origins
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((raw) => {
    const url = raw.trim();
    if (!url) return;
    if (url.startsWith('http')) {
      allowedOrigins.push(url);
    } else {
      allowedOrigins.push(`https://${url}`);
      allowedOrigins.push(`http://${url}`);
    }
  });
}

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS policy does not allow origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests explicitly
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🟢 Cosen API is running', env: process.env.NODE_ENV });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/conversations',  require('./routes/conversations'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sendiyou',      require('./routes/sendiyou'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/payouts',       require('./routes/payouts'));
app.use('/api/banners',       require('./routes/banners'));


// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// ── Socket.io Connection ────────────────────────────────────
const { supabase } = require('./config/db');

// Track online users: userId → Set of socketIds
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  // ── User Presence ───────────────────────────────────
  socket.on('register_user', (userId) => {
    if (!userId) return;
    socket.userId = userId;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    // Broadcast to all clients that this user is now online
    io.emit('user_online', userId);
    console.log(`👤 User online: ${userId} (${onlineUsers.get(userId).size} connections)`);
  });

  // Let clients request the current set of online users
  socket.on('get_online_users', () => {
    const ids = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', ids);
  });

  // Join a private order room
  socket.on('join_order', (orderId) => {
    socket.join(orderId);
    console.log(`User joined order room: ${orderId}`);
  });

  // Client sends a message → persist to DB → broadcast full object to room
  socket.on('send_message', async ({ orderId, senderId, content }) => {
    if (!orderId || !senderId || !content?.trim()) return;
    try {
      const { data: msg, error } = await supabase
        .from('messages')
        .insert({ order_id: orderId, sender_id: senderId, content: content.trim() })
        .select('*, sender:users!sender_id(id, name, avatar_url, avatar_public_id)')
        .single();

      if (error) { console.error('Socket message save error:', error); return; }

      const mapped = {
        ...msg,
        _id: msg.id,
        orderId: msg.order_id,
        senderId: msg.sender_id,
        createdAt: msg.created_at,
        sender: msg.sender ? {
          _id: msg.sender.id,
          name: msg.sender.name,
          avatar: { url: msg.sender.avatar_url || '' },
        } : { _id: senderId, name: 'You' },
      };

      // Emit to everyone in the room (including sender)
      io.to(orderId).emit('receive_message', mapped);
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });

  // ── Direct Message rooms ────────────────────────────
  socket.on('join_dm', (conversationId) => {
    socket.join(`dm_${conversationId}`);
  });

  socket.on('send_dm', async ({ conversationId, senderId, content }) => {
    if (!conversationId || !senderId || !content?.trim()) return;
    try {
      const { data: msg, error } = await supabase
        .from('direct_messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, content: content.trim() })
        .select('*, sender:users!sender_id(id, name, avatar_url)')
        .single();

      if (error) { console.error('DM save error:', error); return; }

      // Update conversation preview
      await supabase
        .from('conversations')
        .update({ last_message: content.trim(), last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      const mapped = {
        _id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        read: msg.read,
        createdAt: msg.created_at,
        sender: msg.sender ? { _id: msg.sender.id, name: msg.sender.name } : { _id: senderId },
      };

      io.to(`dm_${conversationId}`).emit('receive_dm', mapped);
    } catch (err) {
      console.error('Socket send_dm error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    // Remove from presence tracking
    if (socket.userId) {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          // Broadcast to all clients that this user went offline
          io.emit('user_offline', socket.userId);
          console.log(`👤 User offline: ${socket.userId}`);
        }
      }
    }
  });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});
