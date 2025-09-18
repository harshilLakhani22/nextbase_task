// worker/src/processors/imageProcessor.ts
import sharp from 'sharp';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

interface ImageParams {
  originalPath: string;
  userId: string;
  jobId: string;
  thumbnailBasePath: string;
}

export async function processImage({
  originalPath,
  userId,
  jobId,
  thumbnailBasePath,
}: ImageParams): Promise<string> {
  console.log(`[processImage] Processing file: ${originalPath}`);

  if (!fs.existsSync(originalPath)) {
    throw new Error(`Input file is missing: ${originalPath}`);
  }

  const outDir = path.join(thumbnailBasePath, userId);
  await fsPromises.mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, `${jobId}.webp`);

  await sharp(originalPath).resize(128, 128).webp().toFile(outPath);

  return outPath;
}