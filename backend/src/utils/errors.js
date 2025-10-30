/**
 * Custom Error Classes for GitInsights Backend
 *
 * These custom error classes provide structured error handling
 * with proper status codes and sanitized messages for clients.
 */

/**
 * Base Application Error
 * All custom errors extend this class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to safe JSON response
   * Filters out sensitive information
   */
  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Validation Error (400)
 * Used for invalid request parameters, body, or query strings
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.details) {
      json.error.details = this.details;
    }
    return json;
  }
}

/**
 * Authentication Error (401)
 * Used when authentication credentials are missing or invalid
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error (403)
 * Used when user is authenticated but lacks permission
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource cannot be found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limits are exceeded
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.retryAfter) {
      json.error.retryAfter = this.retryAfter;
    }
    return json;
  }
}

/**
 * External Service Error (502)
 * Used when external APIs (GitHub, Claude, etc.) fail
 */
class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }

  toJSON() {
    const json = super.toJSON();
    json.error.service = this.service;
    return json;
  }
}

/**
 * Service Unavailable Error (503)
 * Used when service is temporarily unavailable (maintenance, overload)
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', retryAfter = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.retryAfter = retryAfter;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.retryAfter) {
      json.error.retryAfter = this.retryAfter;
    }
    return json;
  }
}

/**
 * Conflict Error (409)
 * Used when request conflicts with current state (duplicate resource, etc.)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Bad Request Error (400)
 * Generic bad request error
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

/**
 * Path Traversal Error (400)
 * Used specifically for path traversal attempt detection
 */
class PathTraversalError extends AppError {
  constructor(path) {
    super('Invalid file path detected', 400, 'PATH_TRAVERSAL_DETECTED');
    this.attemptedPath = path;
  }
}

/**
 * Helper function to check if error is operational
 * Operational errors are expected and handled gracefully
 * Non-operational errors may indicate bugs and should be logged with full details
 */
export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Sanitize error for logging
 * Removes sensitive information like API keys from error messages
 */
export function sanitizeErrorForLogging(error) {
  const sanitized = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: error.timestamp || new Date().toISOString()
  };

  // Remove potential API keys from message and stack
  const sensitivePatterns = [
    /sk-ant-[a-zA-Z0-9-_]+/g,  // Anthropic keys
    /ghp_[a-zA-Z0-9]+/g,        // GitHub personal tokens
    /gho_[a-zA-Z0-9]+/g,        // GitHub OAuth tokens
    /Bearer [a-zA-Z0-9-._~+/]+/g, // Bearer tokens
  ];

  sensitivePatterns.forEach(pattern => {
    if (sanitized.message) {
      sanitized.message = sanitized.message.replace(pattern, '[REDACTED]');
    }
    if (sanitized.stack) {
      sanitized.stack = sanitized.stack.replace(pattern, '[REDACTED]');
    }
  });

  return sanitized;
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  ServiceUnavailableError,
  ConflictError,
  BadRequestError,
  PathTraversalError
};
