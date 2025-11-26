import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import requestIdMiddleware from './middleware/requestId.js';
import logger, { requestLoggingMiddleware } from './utils/logger.js';
import analysisRoutes from './routes/analysis.js';
import healthRoutes from './routes/health.js';
import { cleanup } from './middleware/rateLimiter.js';

const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(corsMiddleware);

// Request ID middleware (must be early in chain)
app.use(requestIdMiddleware);

// Request logging middleware
app.use(requestLoggingMiddleware);

// Body parser with size limits (prevents payload attacks)
app.use(express.json({
  limit: config.REQUEST_SIZE_LIMIT,
  strict: true,
  verify: (req, res, buf, encoding) => {
    // Additional validation can be added here
    if (buf.length > 0 && encoding === 'utf-8') {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: config.REQUEST_SIZE_LIMIT
}));

// Timeout middleware
app.use((req, res, next) => {
  req.setTimeout(config.REQUEST_TIMEOUT_MS);
  res.setTimeout(config.REQUEST_TIMEOUT_MS);
  next();
});

// Disable X-Powered-By header
app.disable('x-powered-by');

// Trust proxy if behind reverse proxy (for rate limiting, IP detection)
app.set('trust proxy', 1);

/**
 * Routes
 */
app.use('/api/health', healthRoutes);
app.use('/api', analysisRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      path: req.path
    },
    requestId: req.requestId
  });
});

/**
 * Error handler middleware (must be last)
 */
app.use(errorHandler);

/**
 * Global error handlers for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    type: 'uncaughtException'
  });

  // Give time for logger to flush, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    type: 'unhandledRejection'
  });

  // In production, we might want to exit on unhandled rejections
  if (config.NODE_ENV === 'production') {
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

/**
 * Start server
 */
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: config.NODE_ENV,
    port: PORT,
    nodeVersion: process.version
  });
});

// Set server timeout
server.timeout = config.REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = 65000; // Should be greater than load balancer timeout

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Cleanup rate limiter Redis connection
      await cleanup();
      logger.info('Cleanup completed successfully');
    } catch (error) {
      logger.error('Error during cleanup:', { error: error.message });
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export app for Vercel serverless
export default app;
