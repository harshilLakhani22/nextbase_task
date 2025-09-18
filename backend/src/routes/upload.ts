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
    { preValidation: [(fastify as any).authenticate] },
    async (request: FastifyRequest, reply) => {
      // @ts-ignore
      const userId = (request.user as any).userId;
      if (!userId) return reply.code(401).send({ error: 'Missing user id' });

      const userDir = path.resolve(UPLOAD_PATH, 'originals', userId);

      // Ensure user directory exists
      await fsPromises.mkdir(userDir, { recursive: true });

      const jobs: Array<{ jobId: string; status: string; filename: string; thumbnailUrl: string | null }> = [];

      try {
        for await (const part of request.parts()) {
          if (part.type === 'file') {
            const mimetype = part.mimetype || '';
            if (!ALLOWED_MIME.includes(mimetype)) {
              // drain/skip
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
            });

            await enqueueThumbnailJob({
              jobId,
              userId,
              originalPath: filePath,
              mimetype,
              filename,
            });

            // IMPORTANT: do NOT return a thumbnailUrl yet because the worker hasn't generated it.
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
}