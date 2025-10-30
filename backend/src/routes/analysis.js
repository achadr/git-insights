import express from 'express';
import { analyzeRepository, analyzeRepositoryStream } from '../controllers/analysisController.js';
import { validateRepoUrl } from '../middleware/validator.js';
import { freeTierLimiter, apiKeyBypass } from '../middleware/rateLimiter.js';

const router = express.Router();

// Standard REST endpoint for repository analysis
// Apply API key bypass check first, then rate limiting, then validation
router.post('/analyze', apiKeyBypass, freeTierLimiter, validateRepoUrl, analyzeRepository);

// Server-Sent Events endpoint for repository analysis with real-time progress
// Apply same middleware chain for security and consistency
router.post('/analyze/stream', apiKeyBypass, freeTierLimiter, validateRepoUrl, analyzeRepositoryStream);

export default router;
