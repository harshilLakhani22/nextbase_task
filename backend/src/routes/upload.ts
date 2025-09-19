// backend/src/routes/upload.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ThumbnailJob } from '../models/thumbnail';
import { enqueueThumbnailJob } from '../services/queue';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sanitize from 'sanitize-filename';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

export default async function uploadRoutes(fastify: FastifyInstance) {
  const UPLOAD_PATH = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../uploads');

  fastify.post(
    '/api/upload',
    async (request: FastifyRequest, reply) => {
      // Read token from cookie (preferred) or Authorization header
      const cookieToken = (request as any).cookies?.token;
      const authHeader = (request.headers?.authorization || '').startsWith('Bearer ')
        ? (request.headers.authorization as string).split(' ')[1]
        : undefined;
      const token = cookieToken || authHeader;
      let userId: string | null = null;

      if (!token) {
        return reply.code(401).send({ error: 'Unauthorized: missing token' });
      }
      try {
        const decoded = fastify.jwt.verify(token) as any;
        userId = decoded.userId;
        (request as any).user = decoded;
      } catch (err) {
        request.log.warn({ err }, 'Invalid token on /api/upload');
        return reply.code(401).send({ error: 'Unauthorized: invalid token' });
      }

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized: missing user id' });
      }

      const userDir = path.resolve(UPLOAD_PATH, 'originals', String(userId));
      await fsPromises.mkdir(userDir, { recursive: true });

      const jobs: Array<{ jobId: string; status: string; filename: string; thumbnailUrl: string | null }> = [];

      try {
        for await (const part of request.parts()) {
          if (part.type === 'file') {
            const mimetype = part.mimetype || '';
            if (!ALLOWED_MIME.includes(mimetype)) {
              part.file.resume();
              continue;
            }

            const rawName = part.filename || 'file';
            const safeName = sanitize(rawName);
            const filename = `${Date.now()}-${safeName}`;
            const filePath = path.join(userDir, filename);

            await new Promise<void>((resolve, reject) => {
              const writeStream = fs.createWriteStream(filePath);
              part.file.pipe(writeStream);
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            });

            const jobId = randomUUID();
            const jobDoc = await ThumbnailJob.create({
              jobId,
              userId,
              originalPath: filePath,
              mimetype,
              filename,
              status: 'pending',
              thumbnailUrl: null,
            });

            await enqueueThumbnailJob({
              jobId,
              userId,
              originalPath: filePath,
              mimetype,
              filename,
            });

            jobs.push({
              jobId: jobDoc.jobId,
              status: jobDoc.status,
              filename: jobDoc.filename,
              thumbnailUrl: null,
            });
          }
        }

        return reply.code(201).send(jobs);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'File upload failed' });
      }
    }
  );

  // GET all uploads for the authenticated user
  fastify.get('/api/uploads', async (request, reply) => {
    try {
      const cookieToken = (request as any).cookies?.token;
      const authHeader = (request.headers?.authorization || '').startsWith('Bearer ')
        ? (request.headers.authorization as string).split(' ')[1]
        : undefined;
      const token = cookieToken || authHeader;

      if (!token) return reply.code(401).send({ error: 'Unauthorized' });

      const decoded = fastify.jwt.verify(token) as any;
      const userId = decoded.userId;
      if (!userId) return reply.code(401).send({ error: 'Invalid token payload' });

      // Fetch all jobs for this user sorted newest first
      const jobs = await ThumbnailJob.find({ userId }).sort({ createdAt: -1 }).lean();

      const safeJobs = jobs.map((j: any) => ({
        jobId: j.jobId,
        filename: j.filename,
        status: j.status,
        thumbnailUrl: j.thumbnailUrl || null,
        createdAt: j.createdAt,
      }));

      return reply.send(safeJobs);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch uploads' });
    }
  });
}