import express from 'express';
import helmet from 'helmet';
import config from '../src/config/env.js';
import corsMiddleware from '../src/middleware/cors.js';
import errorHandler from '../src/middleware/errorHandler.js';
import requestIdMiddleware from '../src/middleware/requestId.js';
import { requestLoggingMiddleware } from '../src/utils/logger.js';
import analysisRoutes from '../src/routes/analysis.js';
import healthRoutes from '../src/routes/health.js';

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

// Export for Vercel serverless
export default app;
