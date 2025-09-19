// backend/src/server.ts
import Fastify from 'fastify';
import dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketServer } from './socket';
import fastifyCookie from '@fastify/cookie';
dotenv.config();
const server = Fastify({ logger: { level: 'info' } });
// Compute __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use shared upload path (absolute preferred)
const UPLOAD_PATH = process.env.UPLOAD_PATH ? path.resolve(process.env.UPLOAD_PATH) : path.resolve(__dirname, '../uploads');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 200 * 1024 * 1024); // default 200MB
// JWT plugin
server.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'dev_secret' });
server.register(fastifyCookie);
// CORS (allow frontend)
server.register(cors, {
    origin: (origin, cb) => {
        // allow local dev or a configured origin
        cb(null, origin ?? 'http://localhost:3000');
    },
    credentials: true,
});
// JWT Auth decorator
server.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
    }
});
// Serve everything under UPLOAD_PATH at /uploads/*
server.log.info(`Serving uploads from: ${UPLOAD_PATH}`);
server.register(fastifyStatic, {
    root: UPLOAD_PATH,
    prefix: '/uploads/',
});
// Multipart with limits
server.register(multipart, {
    attachFieldsToBody: false,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 20,
    },
});
// Routes
server.register(authRoutes);
server.register(uploadRoutes);
const start = async () => {
    try {
        await connectDB();
        server.log.info('✅ Backend connected');
        // Setup Socket.IO (uses same fastify instance)
        setupSocketServer(server);
        const port = Number(process.env.PORT || 4000);
        await server.listen({ port, host: '0.0.0.0' });
        server.log.info(`🚀 Server running on http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
