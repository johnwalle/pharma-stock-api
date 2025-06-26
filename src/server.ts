import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectWithRetry from '../config/database';
import logger from '../config/logger'; // Your logging utility

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectWithRetry();

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
