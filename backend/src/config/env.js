import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  REDIS_URL: process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
  RATE_LIMIT_FREE_TIER: parseInt(process.env.RATE_LIMIT_FREE_TIER) || 5,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 86400000
};

if (!config.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required in environment variables');
}

if (!config.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required in environment variables');
}

export default config;
