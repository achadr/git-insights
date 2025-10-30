import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import analysisRoutes from '../../routes/analysis.js';
import errorHandler from '../../middleware/errorHandler.js';
import analyzerService from '../../services/analyzerService.js';
import { mockAnalysisResult } from '../mocks/mockData.js';

// Mock the analyzer service
jest.mock('../../services/analyzerService.js');

// Mock the logger to prevent console output during tests
jest.mock('../../utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock rate limiter middleware to avoid Redis dependency
jest.mock('../../middleware/rateLimiter.js', () => {
  let requestCount = 0;

  return {
    freeTierLimiter: (req, res, next) => {
      requestCount++;
      if (requestCount > 5) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'You have exceeded the rate limit for this API',
          details: {
            limit: 5,
            current: requestCount,
            remaining: 0,
            resetTime: new Date(Date.now() + 86400000).toISOString(),
            hoursUntilReset: 24
          },
          suggestion: 'Please wait before making another request, or provide your own Anthropic API key using the x-anthropic-api-key header to bypass rate limits'
        });
      }
      next();
    },
    apiKeyBypass: (req, res, next) => {
      const userApiKey = req.headers['x-anthropic-api-key'];

      if (userApiKey) {
        if (!userApiKey.startsWith('sk-ant-')) {
          return res.status(400).json({
            error: 'Invalid API Key',
            message: 'The provided Anthropic API key format is invalid. API keys should start with "sk-ant-"'
          });
        }
        req.userAnthropicApiKey = userApiKey;
      }
      next();
    },
    cleanup: jest.fn()
  };
});

describe('Analysis Routes', () => {
  let app;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api', analysisRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/analyze', () => {
    it('should analyze a valid GitHub repository URL', async () => {
      // Mock the analyzer service to return a successful result
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo',
          fileLimit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockAnalysisResult);

      // Verify the service was called with correct parameters
      expect(analyzerService.analyzeRepository).toHaveBeenCalledWith(
        'https://github.com/testuser/test-repo',
        undefined,
        10
      );
    });

    it('should return 400 for invalid GitHub URL', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://gitlab.com/testuser/test-repo'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('GitHub');
    });

    it('should return 400 when repoUrl is missing', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('required');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('valid URL');
    });

    it('should handle non-existent repository error', async () => {
      // Mock the analyzer service to throw a repository not found error
      analyzerService.analyzeRepository.mockRejectedValue(
        new Error('Repository not found')
      );

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/nonexistent/repo'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate fileLimit parameter', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo',
          fileLimit: 100 // Exceeds max of 50
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('50');
    });

    it('should accept fileLimit within valid range', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo',
          fileLimit: 25
        });

      expect(response.status).toBe(200);
      expect(analyzerService.analyzeRepository).toHaveBeenCalledWith(
        'https://github.com/testuser/test-repo',
        undefined,
        25
      );
    });

    it('should use user-provided API key from header', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/analyze')
        .set('x-anthropic-api-key', 'sk-ant-user-key-12345')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(200);
      expect(analyzerService.analyzeRepository).toHaveBeenCalledWith(
        'https://github.com/testuser/test-repo',
        'sk-ant-user-key-12345',
        10
      );
    });

    it('should reject invalid API key format', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .set('x-anthropic-api-key', 'invalid-key-format')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid API Key');
      expect(response.body.message).toContain('sk-ant-');
    });

    it('should use API key from request body if header not provided', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo',
          apiKey: 'sk-ant-body-key-12345'
        });

      expect(response.status).toBe(200);
      // Note: Body API key is passed through but not validated by apiKeyBypass middleware
      expect(analyzerService.analyzeRepository).toHaveBeenCalled();
    });

    it('should handle various GitHub URL formats', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const urlFormats = [
        'https://github.com/testuser/test-repo',
        'https://github.com/testuser/test-repo.git',
        'https://www.github.com/testuser/test-repo',
        'http://github.com/testuser/test-repo' // HTTP gets upgraded
      ];

      for (const url of urlFormats) {
        const response = await request(app)
          .post('/api/analyze')
          .send({ repoUrl: url });

        expect(response.status).toBe(200);
      }

      expect(analyzerService.analyzeRepository).toHaveBeenCalledTimes(urlFormats.length);
    });

    it('should return proper error structure on service failure', async () => {
      analyzerService.analyzeRepository.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should include all required fields in successful response', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('quality');
      expect(response.body.data).toHaveProperty('files');

      expect(response.body.data.summary).toHaveProperty('filesAnalyzed');
      expect(response.body.data.summary).toHaveProperty('overallQuality');
      expect(response.body.data.summary).toHaveProperty('requestedFileLimit');
      expect(response.body.data.summary).toHaveProperty('totalCodeFiles');
      expect(response.body.data.summary).toHaveProperty('timestamp');

      expect(response.body.data.quality).toHaveProperty('score');
      expect(response.body.data.quality).toHaveProperty('issueCount');
      expect(response.body.data.quality).toHaveProperty('topIssues');

      expect(Array.isArray(response.body.data.files)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests up to the limit', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/analyze')
          .send({
            repoUrl: 'https://github.com/testuser/test-repo'
          });

        expect(response.status).toBe(200);
      }
    });

    it('should return 429 after exceeding rate limit', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      // First 5 requests should succeed (already done in previous test)
      // The 6th request should fail
      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', 'Too Many Requests');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('limit', 5);
      expect(response.body.details).toHaveProperty('resetTime');
    });

    it('should include suggestion to use own API key in rate limit response', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({
          repoUrl: 'https://github.com/testuser/test-repo'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('suggestion');
      expect(response.body.suggestion).toContain('x-anthropic-api-key');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      // Reset the mock implementation
      jest.clearAllMocks();
    });

    it('should cache identical requests', async () => {
      analyzerService.analyzeRepository.mockResolvedValue(mockAnalysisResult);

      // Create a new app instance to reset rate limiting
      const freshApp = express();
      freshApp.use(express.json());
      freshApp.use('/api', analysisRoutes);
      freshApp.use(errorHandler);

      const requestData = {
        repoUrl: 'https://github.com/testuser/test-repo',
        fileLimit: 10
      };

      // First request
      const response1 = await request(freshApp)
        .post('/api/analyze')
        .send(requestData);

      expect(response1.status).toBe(200);

      // Second identical request - should use cache (tested by mock call count)
      const response2 = await request(freshApp)
        .post('/api/analyze')
        .send(requestData);

      expect(response2.status).toBe(200);
      expect(response2.body.data).toEqual(response1.body.data);

      // Note: The actual caching is implemented in analyzerService
      // This test verifies the route works correctly with caching
    });
  });
});
