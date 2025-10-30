import express from 'express';
import { analyzeRepository } from '../controllers/analysisController.js';
import { validateRepoUrl } from '../middleware/validator.js';
import { freeTierLimiter, apiKeyBypass } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply API key bypass check first, then rate limiting, then validation
router.post('/analyze', apiKeyBypass, freeTierLimiter, validateRepoUrl, analyzeRepository);

export default router;
