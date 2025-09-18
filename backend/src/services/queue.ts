import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const connection = new Redis(process.env.REDIS_URL!);

export const thumbnailQueue = new Queue('thumbnail-jobs', { connection });

export interface ThumbnailJobPayload {
  jobId: string;
  userId: string;
  originalPath: string;
  mimetype: string;
  filename: string;
}

export async function enqueueThumbnailJob(payload: ThumbnailJobPayload) {
  await thumbnailQueue.add('thumbnail', payload, {
    jobId: payload.jobId,
    removeOnComplete: true,
    removeOnFail: false,
  });
}
