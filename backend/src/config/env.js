import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse ALLOWED_ORIGINS from environment variable
 * Supports comma-separated list of origins
 * Example: "http://localhost:5173,https://app.example.com,https://example.com"
 */
function parseAllowedOrigins(originsString) {
  if (!originsString) {
    return ['http://localhost:5173']; // Default for development
  }

  // Split by comma and trim whitespace
  const origins = originsString
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Validate each origin
  origins.forEach(origin => {
    try {
      // Check if valid URL
      const url = new URL(origin);
      // Ensure it's http or https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`Invalid protocol for origin: ${origin}`);
      }
    } catch (error) {
      throw new Error(`Invalid origin in ALLOWED_ORIGINS: ${origin} - ${error.message}`);
    }
  });

  return origins;
}

/**
 * Parse and validate request size limit
 */
function parseRequestSizeLimit(limitString) {
  if (!limitString) {
    return '10mb'; // Default 10MB
  }

  // Validate format (e.g., "10mb", "100kb")
  const sizePattern = /^\d+(?:kb|mb|gb)$/i;
  if (!sizePattern.test(limitString)) {
    throw new Error(`Invalid REQUEST_SIZE_LIMIT format: ${limitString}. Use format like "10mb", "100kb"`);
  }

  return limitString;
}

const config = {
  PORT: process.env.PORT || 3000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  REDIS_URL: process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  RATE_LIMIT_FREE_TIER: parseInt(process.env.RATE_LIMIT_FREE_TIER) || 5,
  RATE_LIMIT_PAID_TIER: parseInt(process.env.RATE_LIMIT_PAID_TIER) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 86400000,
  REQUEST_SIZE_LIMIT: parseRequestSizeLimit(process.env.REQUEST_SIZE_LIMIT),
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000 // 30 seconds default
};

// Validate required environment variables
if (!config.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required in environment variables');
}

if (!config.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required in environment variables');
}

// Log configuration in development (with sensitive data masked)
if (config.NODE_ENV === 'development') {
  console.log('Configuration loaded:');
  console.log(`  PORT: ${config.PORT}`);
  console.log(`  NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  ANTHROPIC_API_KEY: ${config.ANTHROPIC_API_KEY ? '[SET]' : '[NOT SET]'}`);
  console.log(`  ANTHROPIC_MODEL: ${config.ANTHROPIC_MODEL}`);
  console.log(`  GITHUB_TOKEN: ${config.GITHUB_TOKEN ? '[SET]' : '[NOT SET]'}`);
  console.log(`  REDIS_URL: ${config.REDIS_URL || '[NOT SET]'}`);
  console.log(`  ALLOWED_ORIGINS: [${config.ALLOWED_ORIGINS.join(', ')}]`);
  console.log(`  RATE_LIMIT_FREE_TIER: ${config.RATE_LIMIT_FREE_TIER}`);
  console.log(`  REQUEST_SIZE_LIMIT: ${config.REQUEST_SIZE_LIMIT}`);
  console.log(`  REQUEST_TIMEOUT_MS: ${config.REQUEST_TIMEOUT_MS}ms`);
}

export default config;
