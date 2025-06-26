import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app';

// You can toggle between Mongo/Postgres based on env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('Missing MONGO_URI in environment');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', (error as Error).message);
    process.exit(1);
  }
};

startServer();
