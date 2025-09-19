// worker/src/worker.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import pino from 'pino';
import Redis from 'ioredis';
import path from 'path';
import { Worker } from 'bullmq';
import { acquireLock, releaseLock } from './utils/redisLock';
import { processImage } from './processors/imageProcessor';
import { processVideo } from './processors/videoProcessor';
const logger = pino({ level: 'info' });
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// ioredis connections
const loggerRedis = new Redis(redisUrl);
const bullmqConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
// Shared upload path root (absolute preferred). Thumbnails will be at `${UPLOAD_PATH}/thumbnails`
const UPLOAD_PATH = process.env.UPLOAD_PATH ? path.resolve(process.env.UPLOAD_PATH) : path.resolve(process.cwd(), './uploads');
const thumbnailBasePath = path.join(UPLOAD_PATH, 'thumbnails');
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const thumbnailJobSchema = new mongoose.Schema({
    jobId: String,
    userId: String,
    originalPath: String,
    mimetype: String,
    filename: String,
    status: String,
    createdAt: Date,
    thumbnailPath: String,
    thumbnailUrl: String,
    error: String,
});
const ThumbnailJob = mongoose.models.ThumbnailJob || mongoose.model('ThumbnailJob', thumbnailJobSchema);
const pubChannel = 'thumbnails:events';
// create QueueScheduler if available (helps with stalled jobs)
// if (QueueScheduler) {
//   try {
//     const qs = new QueueScheduler('thumbnail-jobs', { connection: bullmqConnection });
//     logger.info('QueueScheduler initialized for thumbnail-jobs');
//   } catch (err) {
//     logger.warn({ err }, 'Failed to initialize QueueScheduler; continuing without it.');
//   }
// }
const worker = new Worker('thumbnail-jobs', 
// processor fn
async (job) => {
    const { jobId, userId, originalPath, mimetype } = job.data;
    let lockValue = null;
    try {
        lockValue = await acquireLock(loggerRedis, userId);
        if (!lockValue) {
            // If lock not acquired, delay job a little and return
            if (typeof job.moveToDelayed === 'function') {
                await job.moveToDelayed(Date.now() + 2000);
            }
            return;
        }
        await ThumbnailJob.updateOne({ jobId }, { status: 'processing' });
        await loggerRedis.publish(pubChannel, JSON.stringify({ jobId, userId, status: 'processing' }));
        let savedThumbnailPath = '';
        if (typeof mimetype === 'string' && mimetype.startsWith('image/')) {
            savedThumbnailPath = await processImage({ originalPath, userId, jobId, thumbnailBasePath });
        }
        else if (typeof mimetype === 'string' && mimetype.startsWith('video/')) {
            savedThumbnailPath = await processVideo({ originalPath, userId, jobId, thumbnailBasePath });
        }
        else {
            throw new Error(`Unsupported mimetype: ${String(mimetype)}`);
        }
        // Use a relative thumbnail URL so clients can compose the full URL
        const thumbnailRelativeUrl = `/uploads/thumbnails/${userId}/${jobId}.webp`;
        await ThumbnailJob.updateOne({ jobId }, { status: 'completed', thumbnailPath: savedThumbnailPath, thumbnailUrl: thumbnailRelativeUrl });
        // publish a compact payload with a relative thumbnailUrl (frontend will prefix with origin)
        await loggerRedis.publish(pubChannel, JSON.stringify({ jobId, userId, status: 'completed', thumbnailPath: savedThumbnailPath, thumbnailUrl: thumbnailRelativeUrl }));
        logger.info(`Job ${jobId} completed for user ${userId}`);
    }
    catch (err) {
        logger.error({ err }, `Job ${job?.data?.jobId || 'unknown'} failed for user ${job?.data?.userId || 'unknown'}`);
        await ThumbnailJob.updateOne({ jobId: job?.data?.jobId }, { status: 'failed', error: err?.message || String(err) });
        await loggerRedis.publish(pubChannel, JSON.stringify({ jobId: job?.data?.jobId, userId: job?.data?.userId, status: 'failed', error: err?.message || String(err) }));
    }
    finally {
        if (lockValue) {
            try {
                await releaseLock(loggerRedis, userId, lockValue);
                logger.info(`Lock released for user ${userId}`);
            }
            catch (releaseErr) {
                logger.error({ releaseErr }, `Failed to release lock for user ${userId}`);
            }
        }
    }
}, {
    connection: bullmqConnection,
    concurrency: 4,
});
// optional active event handler
worker.on('active', async (job) => {
    try {
        await ThumbnailJob.updateOne({ jobId: job.data.jobId }, { status: 'processing' });
        await loggerRedis.publish(pubChannel, JSON.stringify({ jobId: job.data.jobId, userId: job.data.userId, status: 'processing' }));
    }
    catch (e) {
        logger.warn({ e }, 'Failed to update job active state');
    }
});
const start = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nextbase');
    logger.info('Worker connected to MongoDB');
};
start().catch((err) => {
    console.error('Worker failed to start', err);
    process.exit(1);
});
