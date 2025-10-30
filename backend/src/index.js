import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import analysisRoutes from './routes/analysis.js';
import healthRoutes from './routes/health.js';
import { cleanup } from './middleware/rateLimiter.js';

const app = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api', analysisRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Cleanup rate limiter Redis connection
    await cleanup();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
