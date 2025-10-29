import express from 'express';
import { analyzeRepository } from '../controllers/analysisController.js';
import { validateRepoUrl } from '../middleware/validator.js';

const router = express.Router();

router.post('/analyze', validateRepoUrl, analyzeRepository);

export default router;
