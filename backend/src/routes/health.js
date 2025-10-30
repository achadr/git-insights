import express from 'express';
import rateLimit from 'express-rate-limit';
import { getRateLimiterStatus } from '../middleware/rateLimiter.js';
import { Octokit } from '@octokit/rest';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Rate limiter for health endpoint
 * Prevents abuse while allowing monitoring tools reasonable access
 * 60 requests per minute per IP
 */
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many health check requests',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      error: {
        message: 'Too many health check requests',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

/**
 * Check GitHub API connectivity
 */
async function checkGitHubAPI() {
  try {
    const octokit = new Octokit({ auth: config.GITHUB_TOKEN });
    const { data } = await octokit.rateLimit.get();

    return {
      status: 'healthy',
      rateLimit: {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000).toISOString()
      }
    };
  } catch (error) {
    logger.error('GitHub API health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: 'GitHub API unreachable'
    };
  }
}

/**
 * Basic health check endpoint
 * Returns service status without sensitive information
 */
router.get('/', healthLimiter, async (req, res) => {
  const startTime = Date.now();

  try {
    // Get rate limiter status (no sensitive info)
    const rateLimiterStatus = getRateLimiterStatus();

    // Basic health info
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      node: process.version
    };

    // Check if detailed health check is requested (optional query param)
    if (req.query.detailed === 'true') {
      // Only allow detailed checks in development or with proper auth
      if (config.NODE_ENV === 'production') {
        return res.status(403).json({
          status: 'error',
          error: {
            message: 'Detailed health checks not available in production',
            code: 'FORBIDDEN'
          }
        });
      }

      // Check external dependencies
      const githubHealth = await checkGitHubAPI();

      healthInfo.services = {
        github: githubHealth,
        rateLimiter: {
          status: rateLimiterStatus.redisConnected ? 'healthy' : 'degraded',
          store: rateLimiterStatus.storeType
        }
      };

      healthInfo.memory = {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`
      };
    }

    const responseTime = Date.now() - startTime;
    healthInfo.responseTime = `${responseTime}ms`;

    res.json(healthInfo);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        code: 'SERVICE_UNAVAILABLE'
      }
    });
  }
});

/**
 * Readiness probe endpoint
 * Used by orchestrators (Kubernetes, etc.) to check if service is ready
 */
router.get('/ready', healthLimiter, (req, res) => {
  // Check if required services are configured
  const isReady = config.ANTHROPIC_API_KEY && config.GITHUB_TOKEN;

  if (isReady) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Required configuration missing',
        code: 'NOT_READY'
      }
    });
  }
});

/**
 * Liveness probe endpoint
 * Used by orchestrators to check if service is alive
 */
router.get('/live', healthLimiter, (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
