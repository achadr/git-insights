import express from 'express';
import { getRateLimiterStatus } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rateLimiterStatus = getRateLimiterStatus();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rateLimiter: rateLimiterStatus
  });
});

export default router;
