import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Redis client for rate limiting
 * Handles connection errors gracefully and falls back to memory store
 */
let redisClient = null;
let redisConnected = false;

if (config.REDIS_URL) {
  try {
    redisClient = new Redis(config.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      redisConnected = true;
      logger.info('Redis connected successfully for rate limiting');
    });

    redisClient.on('error', (err) => {
      redisConnected = false;
      logger.error(`Redis connection error: ${err.message}`);
    });

    redisClient.on('close', () => {
      redisConnected = false;
      logger.warn('Redis connection closed');
    });
  } catch (error) {
    logger.error(`Failed to initialize Redis client: ${error.message}`);
    redisClient = null;
  }
}

/**
 * Create Redis store or fall back to memory store
 */
function createStore() {
  if (redisClient && redisConnected) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'gitinsights:ratelimit:'
    });
  }

  logger.warn('Using in-memory rate limit store (Redis not available)');
  return undefined; // express-rate-limit will use memory store
}

/**
 * Custom key generator that uses IP address
 * This ensures rate limiting is per-client
 */
const keyGenerator = (req) => {
  // Use x-forwarded-for if behind proxy, otherwise use remote address
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
             req.ip ||
             req.connection.remoteAddress;
  return ip;
};

/**
 * Custom handler for rate limit exceeded
 * Provides clear error messages with retry information
 */
const handler = (req, res) => {
  const resetTime = req.rateLimit.resetTime;
  const resetDate = new Date(resetTime);
  const now = new Date();
  const hoursUntilReset = Math.ceil((resetDate - now) / (1000 * 60 * 60));

  logger.warn(`Rate limit exceeded for IP: ${keyGenerator(req)}`);

  res.status(429).json({
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit for this API',
    details: {
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining,
      resetTime: resetDate.toISOString(),
      hoursUntilReset
    },
    suggestion: 'Please wait before making another request, or provide your own Anthropic API key using the x-anthropic-api-key header to bypass rate limits'
  });
};

/**
 * Skip rate limiting function
 * Checks if request should skip rate limiting
 */
const skip = (req) => {
  // Skip if user provides their own Anthropic API key
  const userApiKey = req.headers['x-anthropic-api-key'];
  if (userApiKey && userApiKey.startsWith('sk-ant-')) {
    logger.info('Rate limiting bypassed - user provided API key');
    return true;
  }
  return false;
};

/**
 * Standard response with rate limit headers
 */
const standardHeaders = true;
const legacyHeaders = false;

/**
 * Free tier rate limiter
 * 5 requests per 24 hours (default)
 * Can be configured via RATE_LIMIT_FREE_TIER environment variable
 */
export const freeTierLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 24 hours
  max: config.RATE_LIMIT_FREE_TIER, // 5 requests
  message: 'Free tier rate limit exceeded',
  standardHeaders,
  legacyHeaders,
  store: createStore(),
  keyGenerator,
  handler,
  skip
});

/**
 * Paid tier rate limiter
 * 100 requests per 24 hours
 */
export const paidTierLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 24 hours
  max: 100, // 100 requests
  message: 'Paid tier rate limit exceeded',
  standardHeaders,
  legacyHeaders,
  store: createStore(),
  keyGenerator,
  handler,
  skip
});

/**
 * API key bypass middleware
 * Checks for user-provided Anthropic API key in headers
 * If present, stores it in req for use by services
 */
export const apiKeyBypass = (req, res, next) => {
  const userApiKey = req.headers['x-anthropic-api-key'];

  if (userApiKey) {
    // Validate API key format
    if (!userApiKey.startsWith('sk-ant-')) {
      return res.status(400).json({
        error: 'Invalid API Key',
        message: 'The provided Anthropic API key format is invalid. API keys should start with "sk-ant-"'
      });
    }

    // Store user's API key for use in services
    req.userAnthropicApiKey = userApiKey;
    logger.info('User provided Anthropic API key - rate limiting bypassed');
  }

  next();
};

/**
 * Health check for Redis connection
 * Useful for monitoring rate limiter status
 */
export const getRateLimiterStatus = () => {
  return {
    redisConfigured: !!config.REDIS_URL,
    redisConnected,
    storeType: redisConnected ? 'redis' : 'memory',
    freeTierLimit: config.RATE_LIMIT_FREE_TIER,
    windowMs: config.RATE_LIMIT_WINDOW_MS
  };
};

/**
 * Cleanup function to close Redis connection gracefully
 */
export const cleanup = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client closed gracefully');
    } catch (error) {
      logger.error(`Error closing Redis client: ${error.message}`);
    }
  }
};
