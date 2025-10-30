import winston from 'winston';
import config from '../config/env.js';
import { sanitizeErrorForLogging } from './errors.js';

/**
 * Enhanced Logger with Structured Logging
 *
 * Features:
 * - Structured JSON logging in production
 * - Human-readable format in development
 * - Request ID tracking
 * - Sensitive data sanitization
 * - Error context preservation
 */

// Custom format for development (human-readable)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    const { timestamp, level, message, requestId, ...meta } = info;
    const reqId = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level} ${reqId}: ${message}${metaStr}`;
  })
);

// Custom format for production (JSON structured)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: config.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: 'gitinsights-backend',
    environment: config.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

/**
 * Create child logger with request context
 * Use this in middleware to attach request ID
 */
export function createRequestLogger(requestId, additionalContext = {}) {
  return logger.child({
    requestId,
    ...additionalContext
  });
}

/**
 * Log with request context
 * Extracts request ID from request object if available
 */
export function logWithContext(level, message, req, meta = {}) {
  const requestId = req?.requestId || req?.locals?.requestId;
  const context = {
    ...meta,
    ...(requestId && { requestId })
  };

  logger.log(level, message, context);
}

/**
 * Log error with full context and sanitization
 * Removes sensitive data before logging
 */
export function logError(error, req = null, additionalContext = {}) {
  const sanitized = sanitizeErrorForLogging(error);
  const requestId = req?.requestId || req?.locals?.requestId;

  logger.error('Error occurred', {
    ...sanitized,
    ...additionalContext,
    ...(requestId && { requestId }),
    url: req?.url,
    method: req?.method,
    ip: req?.ip || req?.headers?.['x-forwarded-for']
  });
}

/**
 * Log API request
 */
export function logRequest(req, res, duration) {
  const requestId = req.requestId;

  logger.info('API Request', {
    requestId,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.headers?.['x-forwarded-for'],
    userAgent: req.headers?.['user-agent']
  });
}

/**
 * Log security event
 * Use for suspicious activities, auth failures, etc.
 */
export function logSecurityEvent(event, details, req = null) {
  const requestId = req?.requestId;

  logger.warn('Security Event', {
    event,
    ...details,
    ...(requestId && { requestId }),
    ip: req?.ip || req?.headers?.['x-forwarded-for'],
    timestamp: new Date().toISOString()
  });
}

/**
 * Express middleware for request logging
 * Logs all incoming requests with timing
 */
export function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req, res, duration);
  });

  next();
}

export default logger;
