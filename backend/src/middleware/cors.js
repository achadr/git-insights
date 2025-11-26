import cors from 'cors';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Enhanced CORS Configuration
 *
 * Security improvements:
 * - Validates origin against whitelist
 * - Supports multiple origins from environment
 * - Logs suspicious CORS attempts
 * - Proper handling of requests without origin
 * - Explicit allowed methods and headers
 * - Preflight caching configuration
 */

/**
 * Origin validation function
 * Checks if the requesting origin is in the allowed list
 */
function validateOrigin(origin, callback) {
  // Allow requests with no origin (like mobile apps, curl, Postman)
  // but only in development mode
  if (!origin) {
    if (config.NODE_ENV === 'development') {
      logger.debug('CORS: Request with no origin allowed in development');
      return callback(null, true);
    }
    logger.warn('CORS: Request with no origin rejected in production');
    return callback(new Error('Origin not allowed'), false);
  }

  // Check if origin is in allowed list
  if (config.ALLOWED_ORIGINS.includes(origin)) {
    logger.debug(`CORS: Origin allowed: ${origin}`);
    return callback(null, true);
  }

  // Check for wildcard in development
  if (config.NODE_ENV === 'development' && config.ALLOWED_ORIGINS.includes('*')) {
    logger.debug(`CORS: Wildcard origin allowed in development: ${origin}`);
    return callback(null, true);
  }

  // Origin not allowed
  logger.warn(`CORS: Origin rejected: ${origin}`, {
    allowedOrigins: config.ALLOWED_ORIGINS
  });
  return callback(new Error('Origin not allowed by CORS'), false);
}

/**
 * CORS options configuration
 */
const corsOptions = {
  // Origin validation
  origin: validateOrigin,

  // Allow credentials (cookies, authorization headers)
  // Disabled in development to allow wildcard origin
  credentials: config.NODE_ENV !== 'development',

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-Anthropic-API-Key',
    'Accept',
    'Origin'
  ],

  // Exposed headers (accessible to client)
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],

  // Preflight cache duration (24 hours)
  maxAge: 86400,

  // Pass the CORS preflight response to the next handler
  preflightContinue: false,

  // Provide a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204
};

/**
 * Log CORS configuration on startup
 */
if (config.NODE_ENV === 'development') {
  logger.info('CORS Configuration:', {
    allowedOrigins: config.ALLOWED_ORIGINS,
    allowedMethods: corsOptions.methods,
    credentials: corsOptions.credentials
  });
}

export default cors(corsOptions);
