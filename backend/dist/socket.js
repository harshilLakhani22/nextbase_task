// backend/src/socket.ts
import { Server as IOServer } from 'socket.io';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
export function setupSocketServer(fastify) {
    // Create Socket.IO instance
    const io = new IOServer(fastify.server, {
        cors: {
            origin: 'http://localhost:3000', // frontend
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Middleware for JWT authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('No token'));
        }
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            // @ts-ignore
            socket.user = payload;
            // @ts-ignore
            socket.join(`user:${payload.userId}`);
            return next();
        }
        catch (err) {
            return next(new Error('Invalid token'));
        }
    });
    // Subscribe to Redis channel
    redis.subscribe('thumbnails:events', (err, count) => {
        if (err) {
            console.error('Redis subscribe error:', err);
        }
        else {
            console.log(`✅ Subscribed to ${count} Redis channel(s).`);
        }
    });
    // Handle Redis messages
    redis.on('message', (channel, message) => {
        if (channel === 'thumbnails:events') {
            try {
                const data = JSON.parse(message);
                if (data.userId && data.jobId && data.status) {
                    io.emit('thumbnail:job:update', {
                        jobId: data.jobId,
                        status: data.status,
                        thumbnailUrl: data.thumbnailUrl, // <-- use the correct field
                        thumbnailPath: data.thumbnailPath, // (optional, for debugging)
                        error: data.error,
                    });
                }
            }
            catch (e) {
                console.error('❌ Error parsing Redis message:', e);
            }
        }
    });
    // Attach io to fastify
    fastify.decorate('io', io);
    console.log('✅ Socket.IO server initialized');
}
