// Test setup file
// This file runs before all tests to configure the test environment

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-12345';
process.env.ANTHROPIC_MODEL = 'claude-sonnet-4';
process.env.GITHUB_TOKEN = 'ghp_test_token_12345';
process.env.REDIS_URL = ''; // Disable Redis for tests
process.env.RATE_LIMIT_FREE_TIER = '5';
process.env.RATE_LIMIT_WINDOW_MS = '86400000'; // 24 hours

// Suppress console output during tests
const noop = () => {};
global.console = {
  ...console,
  log: noop,
  debug: noop,
  info: noop,
  warn: noop,
  // Keep error for debugging test failures
  // error: noop,
};
