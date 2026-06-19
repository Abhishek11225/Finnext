import mongoose from 'mongoose';
import { getEnv } from '@/lib/env';

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    const mongoUri = getEnv('MONGODB_URI');

    if(cached.conn) return cached.conn;

    if(!cached.promise) {
        cached.promise = mongoose.connect(mongoUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10_000,
            maxPoolSize: 10,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to MongoDB (${process.env.NODE_ENV ?? 'development'})`);

    return cached.conn;
}
