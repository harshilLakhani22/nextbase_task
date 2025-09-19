// backend/src/socket.ts
import { Server as IOServer } from 'socket.io';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import cookie from 'cookie';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export function setupSocketServer(fastify: FastifyInstance) {
  // Create Socket.IO instance attached to the fastify http server
  const io = new IOServer(fastify.server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for JWT authentication:
  // Support token via:
  //  - httpOnly cookie "token" (preferred)
  //  - socket.handshake.auth.token (fallback)
  //  - socket.handshake.query.token (fallback)
  io.use((socket, next) => {
    try {
      // 1) Try auth.token (if client sends)
      let token: string | undefined = (socket.handshake.auth && (socket.handshake.auth as any).token) as string;

      // 2) Try query token (fallback)
      if (!token && socket.handshake.query && (socket.handshake.query as any).token) {
        token = (socket.handshake.query as any).token as string;
      }

      // 3) Try cookie header (handshake headers)
      if (!token) {
        const cookieHeader = (socket.handshake.headers && (socket.handshake.headers.cookie as string)) || '';
        if (cookieHeader) {
          const parsed = cookie.parse(cookieHeader || '');
          token = parsed.token;
        }
      }

      if (!token) {
        return next(new Error('Unauthorized: no token provided'));
      }

      // Use fastify JWT verify so it uses the same secret and settings
      const payload = fastify.jwt.verify(token) as any;

      // Attach payload to socket and join user room
      (socket as any).user = payload;
      if (payload && payload.userId) {
        socket.join(`user:${payload.userId}`);
      }

      return next();
    } catch (err) {
      fastify.log?.warn({ err }, 'Socket auth failed');
      return next(new Error('Unauthorized: invalid token'));
    }
  });

  // Subscribe to Redis channel(s)
  redis.subscribe('thumbnails:events', (err, count) => {
    if (err) {
      console.error('Redis subscribe error:', err);
    } else {
      console.log(`✅ Subscribed to ${count} Redis channel(s).`);
    }
  });

  // When Redis publishes an event, route it to the specific user room if userId present.
  redis.on('message', (channel, message) => {
    if (channel !== 'thumbnails:events') return;

    try {
      const data = JSON.parse(message);

      // Expect data structure to include userId and jobId, status, etc.
      const userId = data.userId;
      const payload = {
        jobId: data.jobId,
        status: data.status,
        thumbnailUrl: data.thumbnailUrl ?? null,
        thumbnailPath: data.thumbnailPath ?? null,
        error: data.error ?? null,
      };

      if (userId) {
        // Emit to the specific user's room
        io.to(`user:${userId}`).emit('thumbnail:job:update', payload);
      } else {
        // If no userId, broadcast (fallback)
        io.emit('thumbnail:job:update', payload);
      }
    } catch (e) {
      console.error('❌ Error parsing Redis message:', e);
    }
  });

  // Attach io instance to fastify so other modules can use it
  fastify.decorate('io', io);

  console.log('✅ Socket.IO server initialized');
}