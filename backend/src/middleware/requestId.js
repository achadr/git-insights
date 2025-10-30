import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * Generates a unique request ID for each incoming request
 * and attaches it to the request object and response headers.
 *
 * This enables:
 * - Request tracing across logs
 * - Debugging specific requests
 * - Correlation of errors with requests
 * - Client-side error reporting
 */

/**
 * Generate or extract request ID
 * Accepts existing request ID from client (X-Request-ID header)
 * or generates a new UUID v4
 */
function generateRequestId(req) {
  // Check if client provided a request ID
  const clientRequestId = req.headers['x-request-id'];

  if (clientRequestId && isValidRequestId(clientRequestId)) {
    return clientRequestId;
  }

  // Generate new UUID v4
  return randomUUID();
}

/**
 * Validate request ID format
 * Accept UUID v4 format or alphanumeric with hyphens
 */
function isValidRequestId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // UUID v4 format or custom alphanumeric format (max 128 chars)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const customPattern = /^[a-zA-Z0-9-_]{1,128}$/;

  return uuidPattern.test(id) || customPattern.test(id);
}

/**
 * Request ID Middleware
 */
export default function requestIdMiddleware(req, res, next) {
  // Generate or extract request ID
  const requestId = generateRequestId(req);

  // Attach to request object for use in controllers/services
  req.requestId = requestId;

  // Add to response headers so client can reference it
  res.setHeader('X-Request-ID', requestId);

  // Add to response locals for access in error handlers
  res.locals.requestId = requestId;

  next();
}

/**
 * Get request ID from request object
 * Utility function for services/controllers
 */
export function getRequestId(req) {
  return req.requestId || 'unknown';
}
