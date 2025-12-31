require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const { setOnline, removeOnline, getSocketId, getOnlineUserIds } = require('./utils/onlineUsers');

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

console.log('Allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl) or matching origins
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

// Debug route to inspect CORS configuration in production
app.get('/debug/cors', (req, res) => {
  return res.json({
    requestOrigin: req.headers.origin || null,
    allowedOrigins,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Unauthorized'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

  io.on('connection', (socket) => {
  const userId = socket.userId;
  setOnline(userId, socket.id);

  socket.emit('online_users', getOnlineUserIds());
  socket.broadcast.emit('user_online', { userId });

  socket.on('typing', (data) => {
    const targetSocketId = getSocketId(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user_typing', { from: userId, to: data.to });
    }
  });

  socket.on('stop_typing', (data) => {
    const targetSocketId = getSocketId(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user_stop_typing', { from: userId, to: data.to });
    }
  });

  socket.on('private_message', async (data, ack) => {
    try {
      const to = data?.to;
      const content = data?.content?.trim();
      const replyTo = data?.replyTo;

      if (!to || !content) {
        ack?.({ ok: false, message: 'Recipient and message are required' });
        return;
      }

      const messageData = { sender: userId, recipient: to, content };
      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      const message = await Message.create(messageData);
      const payload = {
        id: message._id.toString(),
        sender: userId,
        recipient: to,
        content: message.content,
        replyTo: message.replyTo ? message.replyTo.toString() : null,
        seenBy: [],
        reactions: [],
        createdAt: message.createdAt,
      };

      const targetSocketId = getSocketId(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('private_message', payload);
        // Also emit mark_as_seen to notify sender that recipient has received it
        io.to(targetSocketId).emit('message_seen', { messageId: message._id.toString(), userId: to });
      }

      ack?.({ ok: true, message: payload });
    } catch (err) {
      console.error('Socket private_message error', err);
      ack?.({ ok: false, message: 'Failed to send message' });
    }
  });

  socket.on('mark_as_seen', async (data) => {
    try {
      const messageId = data?.messageId;
      if (!messageId) return;

      const message = await Message.findById(messageId);
      if (message && !message.seenBy.includes(userId)) {
        message.seenBy.push(userId);
        await message.save();

        const senderSocketId = getSocketId(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_seen', { messageId, userId });
        }
      }
    } catch (err) {
      console.error('Mark as seen error', err);
    }
  });

  socket.on('add_reaction', async (data) => {
    try {
      const messageId = data?.messageId;
      const emoji = data?.emoji;

      if (!messageId || !emoji) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      const existingReaction = message.reactions.find(
        (r) => r.userId.toString() === userId && r.emoji === emoji
      );

      if (existingReaction) {
        message.reactions = message.reactions.filter(
          (r) => !(r.userId.toString() === userId && r.emoji === emoji)
        );
      } else {
        message.reactions.push({ userId, emoji });
      }

      await message.save();

      const reactionPayload = {
        messageId,
        reactions: message.reactions.map((r) => ({
          userId: r.userId.toString(),
          emoji: r.emoji,
        })),
      };

      io.to(getSocketId(message.sender.toString())).emit('reaction_updated', reactionPayload);
      io.to(getSocketId(message.recipient.toString())).emit('reaction_updated', reactionPayload);
    } catch (err) {
      console.error('Add reaction error', err);
    }
  });

  socket.on('disconnect', () => {
    removeOnline(userId);
    socket.broadcast.emit('user_offline', { userId });
  });
});

async function start() {
  try {
    await connectToDatabase(process.env.MONGO_URI);
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`API and sockets listening on port ${port}`);
    });
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
}

start();
