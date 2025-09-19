import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
export const connectDB = async () => {
    if (!MONGO_URI)
        throw new Error('MONGO_URI not set');
    await mongoose.connect(MONGO_URI);
};
