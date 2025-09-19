import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();
const connection = new Redis(process.env.REDIS_URL);
export const thumbnailQueue = new Queue('thumbnail-jobs', { connection });
export async function enqueueThumbnailJob(payload) {
    await thumbnailQueue.add('thumbnail', payload, {
        jobId: payload.jobId,
        removeOnComplete: true,
        removeOnFail: false,
    });
}
