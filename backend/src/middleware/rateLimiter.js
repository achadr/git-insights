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
 * API Key Validation Cache
 * Cache validated API keys to avoid repeated validation calls
 * TTL: 1 hour
 */
const apiKeyValidationCache = new Map();
const API_KEY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Clean expired cache entries
 */
function cleanApiKeyCache() {
  const now = Date.now();
  for (const [key, value] of apiKeyValidationCache.entries()) {
    if (now - value.timestamp > API_KEY_CACHE_TTL) {
      apiKeyValidationCache.delete(key);
    }
  }
}

// Clean cache every 10 minutes
setInterval(cleanApiKeyCache, 10 * 60 * 1000);

/**
 * Validate Anthropic API key by making a test request
 * This ensures the key is not only formatted correctly but actually works
 */
async function validateAnthropicApiKey(apiKey) {
  // Check format first (quick validation)
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return { valid: false, reason: 'Invalid API key format' };
  }

  // Check cache
  const cached = apiKeyValidationCache.get(apiKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < API_KEY_CACHE_TTL) {
      logger.debug('API key validation: cache hit');
      return { valid: cached.valid, reason: cached.reason };
    }
  }

  // Validate with actual API call (lightweight request)
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    // Make a minimal request to validate the key
    // Using a very small message to minimize cost
    await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }]
    });

    // Cache successful validation
    apiKeyValidationCache.set(apiKey, {
      valid: true,
      timestamp: Date.now()
    });

    logger.info('API key validated successfully');
    return { valid: true };
  } catch (error) {
    const reason = error.status === 401
      ? 'Invalid or expired API key'
      : 'API key validation failed';

    // Cache failed validation for a shorter time (5 minutes)
    if (error.status === 401) {
      apiKeyValidationCache.set(apiKey, {
        valid: false,
        reason,
        timestamp: Date.now() - (API_KEY_CACHE_TTL - 5 * 60 * 1000)
      });
    }

    logger.warn('API key validation failed', { reason, status: error.status });
    return { valid: false, reason };
  }
}

/**
 * API key bypass middleware
 * Checks for user-provided Anthropic API key in headers
 * If present, validates it and stores it in req for use by services
 */
export const apiKeyBypass = async (req, res, next) => {
  const userApiKey = req.headers['x-anthropic-api-key'];

  if (userApiKey) {
    // Validate API key format and functionality
    const validation = await validateAnthropicApiKey(userApiKey);

    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid API Key',
        message: validation.reason || 'The provided Anthropic API key is invalid',
        code: 'INVALID_API_KEY'
      });
    }

    // Store user's API key for use in services
    req.userAnthropicApiKey = userApiKey;
    logger.info('User provided valid Anthropic API key - rate limiting bypassed');
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
