// worker/src/processors/videoProcessor.ts
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
ffmpeg.setFfmpegPath(ffmpegPath);
export async function processVideo({ originalPath, userId, jobId, thumbnailBasePath, }) {
    console.log(`[processVideo] Processing file: ${originalPath}`);
    if (!fs.existsSync(originalPath)) {
        throw new Error(`Input file is missing: ${originalPath}`);
    }
    const outDir = path.join(thumbnailBasePath, userId);
    await fsPromises.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${jobId}.webp`);
    // Probe duration
    const duration = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(originalPath, (err, metadata) => {
            if (err)
                return reject(err);
            resolve(metadata?.format?.duration || 0);
        });
    });
    const seekTime = Math.max(0, duration / 2 || 0);
    // temporary frame path
    const tmpFrame = path.join(os.tmpdir(), `thumb-${jobId}-${uuidv4()}.png`);
    await new Promise((resolve, reject) => {
        ffmpeg(originalPath)
            .screenshots({
            timestamps: [seekTime],
            filename: path.basename(tmpFrame),
            folder: path.dirname(tmpFrame),
            size: '640x?',
        })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
    // Ensure frame exists
    if (!fs.existsSync(tmpFrame)) {
        throw new Error('Failed to extract frame from video');
    }
    // Resize with sharp and write final thumbnail
    await sharp(tmpFrame).resize(128, 128).webp().toFile(outPath);
    // Cleanup tmpFrame
    try {
        await fsPromises.unlink(tmpFrame);
    }
    catch (e) {
        // ignore cleanup error
    }
    return outPath;
}
