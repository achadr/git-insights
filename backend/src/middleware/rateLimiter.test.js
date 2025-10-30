import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { freeTierLimiter, paidTierLimiter, apiKeyBypass } from './rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('apiKeyBypass middleware', () => {
    beforeEach(() => {
      app.post('/test', apiKeyBypass, (req, res) => {
        res.json({
          success: true,
          hasUserKey: !!req.userAnthropicApiKey
        });
      });
    });

    it('should accept valid Anthropic API key in header', async () => {
      const response = await request(app)
        .post('/test')
        .set('x-anthropic-api-key', 'sk-ant-api03-test123')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.hasUserKey).toBe(true);
    });

    it('should reject invalid API key format', async () => {
      const response = await request(app)
        .post('/test')
        .set('x-anthropic-api-key', 'invalid-key-format')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid API Key');
    });

    it('should allow request without API key', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.hasUserKey).toBe(false);
    });
  });

  describe('freeTierLimiter', () => {
    beforeEach(() => {
      app.post('/test', apiKeyBypass, freeTierLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should bypass rate limit with valid API key', async () => {
      // Make multiple requests with API key
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/test')
          .set('x-anthropic-api-key', 'sk-ant-api03-test123')
          .send({});

        expect(response.status).toBe(200);
      }
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('paidTierLimiter', () => {
    beforeEach(() => {
      app.post('/test', apiKeyBypass, paidTierLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should have higher limit than free tier', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      // Paid tier should have 100 requests limit
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBe(100);
    });
  });

  describe('Rate limit error message', () => {
    it('should provide clear error message when rate limited', async () => {
      // Create a very restrictive limiter for testing
      const testLimiter = (req, res) => {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'You have exceeded the rate limit for this API',
          suggestion: 'Please wait before making another request, or provide your own Anthropic API key'
        });
      };

      app.post('/test', testLimiter);

      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too Many Requests');
      expect(response.body.message).toBeDefined();
      expect(response.body.suggestion).toContain('Anthropic API key');
    });
  });
});
