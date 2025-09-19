// backend/src/models/thumbnail.ts
import mongoose, { Schema } from 'mongoose';
const ThumbnailJobSchema = new Schema({
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
}, {
    timestamps: true, // adds createdAt and updatedAt automatically
});
export const ThumbnailJob = mongoose.model('ThumbnailJob', ThumbnailJobSchema);
