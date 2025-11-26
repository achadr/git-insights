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
    // Allow wildcard '*' for development/demo
    if (origin === '*') {
      return;
    }

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

/**
 * Validate required environment variables with helpful error messages
 */
function validateEnvironmentVariables() {
  const errors = [];
  const warnings = [];

  // Required variables (skip in development mode for demo deployments)
  if (config.NODE_ENV !== 'development' &&
      (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here')) {
    errors.push({
      variable: 'ANTHROPIC_API_KEY',
      message: 'Anthropic API key is required',
      solution: 'Get your API key from https://console.anthropic.com/settings/keys',
      steps: [
        '1. Sign up or log in to https://console.anthropic.com/',
        '2. Navigate to API Keys section',
        '3. Create a new API key',
        '4. Add it to your .env file: ANTHROPIC_API_KEY=your-key-here'
      ]
    });
  }

  // Log demo mode warning
  if (config.NODE_ENV === 'development' && !config.ANTHROPIC_API_KEY) {
    warnings.push({
      variable: 'ANTHROPIC_API_KEY',
      message: 'Running in DEMO MODE - using mock analysis data',
      impact: 'AI analysis will return mock data instead of real Claude API results',
      solution: 'This is perfect for portfolio demos. For production, set ANTHROPIC_API_KEY and NODE_ENV=production'
    });
  }

  if (!config.GITHUB_TOKEN || config.GITHUB_TOKEN === 'your-github-personal-access-token-here') {
    errors.push({
      variable: 'GITHUB_TOKEN',
      message: 'GitHub Personal Access Token is required',
      solution: 'Create a token at https://github.com/settings/tokens',
      steps: [
        '1. Go to GitHub Settings > Developer settings > Personal access tokens',
        '2. Click "Generate new token (classic)"',
        '3. Select scopes: repo, read:user',
        '4. Generate and copy the token',
        '5. Add it to your .env file: GITHUB_TOKEN=your-token-here'
      ]
    });
  }

  // Optional but recommended
  if (!config.REDIS_URL) {
    warnings.push({
      variable: 'REDIS_URL',
      message: 'Redis URL not configured - using in-memory storage',
      impact: 'Rate limiting will not persist across server restarts',
      solution: 'Install Redis and set REDIS_URL=redis://localhost:6379'
    });
  }

  // Display errors
  if (errors.length > 0) {
    console.error('\n========================================');
    console.error('ENVIRONMENT CONFIGURATION ERRORS');
    console.error('========================================\n');

    errors.forEach((error, index) => {
      console.error(`Error ${index + 1}: ${error.variable}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Solution: ${error.solution}`);
      console.error('  Steps:');
      error.steps.forEach(step => console.error(`    ${step}`));
      console.error('');
    });

    console.error('========================================');
    console.error('Please configure the required environment variables in your .env file');
    console.error('See backend/.env.example for a template');
    console.error('========================================\n');

    throw new Error(`Missing required environment variables: ${errors.map(e => e.variable).join(', ')}`);
  }

  // Display warnings
  if (warnings.length > 0 && config.NODE_ENV === 'development') {
    console.warn('\n========================================');
    console.warn('ENVIRONMENT CONFIGURATION WARNINGS');
    console.warn('========================================\n');

    warnings.forEach((warning, index) => {
      console.warn(`Warning ${index + 1}: ${warning.variable}`);
      console.warn(`  Message: ${warning.message}`);
      console.warn(`  Impact: ${warning.impact}`);
      console.warn(`  Solution: ${warning.solution}`);
      console.warn('');
    });

    console.warn('========================================\n');
  }
}

// Validate environment variables
validateEnvironmentVariables();

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
