import { logError, logSecurityEvent } from '../utils/logger.js';
import config from '../config/env.js';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  PathTraversalError,
  isOperationalError
} from '../utils/errors.js';

/**
 * Enhanced Error Handler Middleware
 *
 * Security improvements:
 * - No sensitive data in error responses
 * - Sanitized logging with Winston
 * - Custom error classes with proper status codes
 * - Different handling for production vs development
 * - Request ID tracking for debugging
 */

const errorHandler = (err, req, res, next) => {
  // Don't expose sensitive information in production
  const isDevelopment = config.NODE_ENV === 'development';

  // Log error with full context (sanitized automatically)
  logError(err, req, {
    isOperational: isOperationalError(err),
    origin: err.constructor.name
  });

  // Log security events for certain error types
  if (err instanceof PathTraversalError || err instanceof AuthenticationError) {
    logSecurityEvent(err.constructor.name, {
      message: err.message,
      path: req.path,
      method: req.method
    }, req);
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    const response = err.toJSON();

    // Add request ID for client reference
    if (req.requestId) {
      response.requestId = req.requestId;
    }

    // In development, add stack trace
    if (isDevelopment && err.stack) {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Express body-parser errors (invalid JSON, etc.)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        statusCode: 400
      },
      requestId: req.requestId
    });
  }

  // Handle Express payload too large error
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: {
        message: 'Request payload too large',
        code: 'PAYLOAD_TOO_LARGE',
        statusCode: 413
      },
      requestId: req.requestId
    });
  }

  // Handle multer/file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        message: 'File size exceeds limit',
        code: 'FILE_TOO_LARGE',
        statusCode: 413
      },
      requestId: req.requestId
    });
  }

  // Handle MongoDB/database errors (if applicable)
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database error occurred',
        code: 'DATABASE_ERROR',
        statusCode: 500
      },
      requestId: req.requestId
    });
  }

  // Handle JWT errors (if using JWT authentication)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        statusCode: 401
      },
      requestId: req.requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token expired',
        code: 'TOKEN_EXPIRED',
        statusCode: 401
      },
      requestId: req.requestId
    });
  }

  // Handle validation errors from libraries like Joi, express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: isDevelopment ? err.details : undefined
      },
      requestId: req.requestId
    });
  }

  // Generic/Unknown errors - don't expose details in production
  const statusCode = err.statusCode || 500;
  const message = isDevelopment
    ? err.message
    : 'An unexpected error occurred';

  const response = {
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR',
      statusCode
    },
    requestId: req.requestId
  };

  // Add stack trace only in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
