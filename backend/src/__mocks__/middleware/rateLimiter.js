// Manual mock for rateLimiter middleware
// This ensures no Redis connections or real API calls during tests

export const freeTierLimiter = (req, res, next) => next();

export const apiKeyBypass = async (req, res, next) => {
  const userApiKey = req.headers['x-anthropic-api-key'];

  if (userApiKey) {
    // Simple format validation only - no real API calls
    if (!userApiKey.startsWith('sk-ant-')) {
      return res.status(401).json({
        error: 'Invalid API Key',
        message: 'The provided Anthropic API key format is invalid. API keys should start with "sk-ant-"',
        code: 'INVALID_API_KEY'
      });
    }
    req.userAnthropicApiKey = userApiKey;
  }
  next();
};

export const paidTierLimiter = (req, res, next) => next();

export const cleanup = () => Promise.resolve();

export const getRateLimiterStatus = () => ({
  redisConfigured: false,
  redisConnected: false,
  storeType: 'memory',
  freeTierLimit: 10000,
  windowMs: 3600000
});
