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
  error?: string;
}

const ThumbnailJobSchema = new Schema<IThumbnailJob>({
  jobId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  originalPath: { type: String, required: true },
  mimetype: { type: String, required: true },
  filename: { type: String, required: true },
  status: { type: String, enum: ['pending', 'queued', 'processing', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  error: { type: String },
});

export const ThumbnailJob = mongoose.model<IThumbnailJob>('ThumbnailJob', ThumbnailJobSchema);
