// backend/src/models/thumbnail.ts
import mongoose, { Document, Schema } from 'mongoose';

export type ThumbnailJobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

export interface IThumbnailJob extends Document {
  jobId: string;
  userId: string;
  originalPath: string;
  mimetype: string;
  filename: string;
  status: ThumbnailJobStatus;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string | null;
  error?: string;
}

const ThumbnailJobSchema = new Schema<IThumbnailJob>(
  {
    jobId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    originalPath: { type: String, required: true },
    mimetype: { type: String, required: true },
    filename: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    thumbnailUrl: { type: String, default: null },
    error: { type: String, default: null },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export const ThumbnailJob = mongoose.model<IThumbnailJob>('ThumbnailJob', ThumbnailJobSchema);