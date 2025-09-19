import mongoose, { Schema } from 'mongoose';
const ThumbnailJobSchema = new Schema({
    jobId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    originalPath: { type: String, required: true },
    mimetype: { type: String, required: true },
    filename: { type: String, required: true },
    status: { type: String, enum: ['pending', 'queued', 'processing', 'completed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    error: { type: String },
});
export const ThumbnailJob = mongoose.model('ThumbnailJob', ThumbnailJobSchema);
