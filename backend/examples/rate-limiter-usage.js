/**
 * Rate Limiter Usage Examples
 *
 * This file demonstrates how to use the GitInsights rate limiting middleware
 * in different scenarios.
 */

import express from 'express';
import {
  freeTierLimiter,
  paidTierLimiter,
  apiKeyBypass,
  getRateLimiterStatus
} from '../src/middleware/rateLimiter.js';

const app = express();
app.use(express.json());

// Example 1: Basic free tier rate limiting
// Applies 5 requests per 24 hours, but bypasses if user provides API key
app.post('/api/analyze', apiKeyBypass, freeTierLimiter, (req, res) => {
  res.json({
    message: 'Analysis complete',
    usingUserApiKey: !!req.userAnthropicApiKey
  });
});

// Example 2: Paid tier rate limiting
// Applies 100 requests per 24 hours, but bypasses if user provides API key
app.post('/api/analyze-premium', apiKeyBypass, paidTierLimiter, (req, res) => {
  res.json({
    message: 'Premium analysis complete',
    usingUserApiKey: !!req.userAnthropicApiKey
  });
});

// Example 3: Custom route with different limits
// You can create custom rate limiters by importing rateLimit and configuring
import rateLimit from 'express-rate-limit';

const customLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip if user provides API key
    return req.headers['x-anthropic-api-key']?.startsWith('sk-ant-');
  }
});

app.post('/api/quick-analysis', apiKeyBypass, customLimiter, (req, res) => {
  res.json({ message: 'Quick analysis complete' });
});

// Example 4: Endpoint without rate limiting (health check)
app.get('/api/health', (req, res) => {
  const status = getRateLimiterStatus();
  res.json({
    status: 'ok',
    rateLimiter: status
  });
});

// Example 5: Conditional rate limiting based on request type
app.post('/api/flexible', apiKeyBypass, (req, res, next) => {
  // Apply different rate limits based on request
  const isPremium = req.body.tier === 'premium';
  const limiter = isPremium ? paidTierLimiter : freeTierLimiter;
  limiter(req, res, next);
}, (req, res) => {
  res.json({ message: 'Flexible analysis complete' });
});

// Error handler for rate limit errors
app.use((err, req, res, next) => {
  if (err.status === 429) {
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: err.message,
      retryAfter: err.retryAfter
    });
  } else {
    next(err);
  }
});

// Client usage examples:

/**
 * Example 1: Making a standard request (rate limited)
 *
 * fetch('http://localhost:3000/api/analyze', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     repoUrl: 'https://github.com/user/repo'
 *   })
 * })
 * .then(res => {
 *   console.log('Rate limit remaining:', res.headers.get('X-RateLimit-Remaining'));
 *   return res.json();
 * })
 * .then(data => console.log(data));
 */

/**
 * Example 2: Making a request with user API key (bypass rate limit)
 *
 * fetch('http://localhost:3000/api/analyze', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-anthropic-api-key': 'sk-ant-api03-your-key-here'
 *   },
 *   body: JSON.stringify({
 *     repoUrl: 'https://github.com/user/repo'
 *   })
 * })
 * .then(res => res.json())
 * .then(data => console.log(data));
 */

/**
 * Example 3: Handling rate limit errors
 *
 * async function analyzeWithRetry(repoUrl) {
 *   try {
 *     const response = await fetch('http://localhost:3000/api/analyze', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ repoUrl })
 *     });
 *
 *     if (response.status === 429) {
 *       const error = await response.json();
 *       console.log('Rate limited. Reset at:', error.details.resetTime);
 *       console.log('Hours until reset:', error.details.hoursUntilReset);
 *       console.log('Suggestion:', error.suggestion);
 *
 *       // Wait and retry, or prompt user for API key
 *       return null;
 *     }
 *
 *     return await response.json();
 *   } catch (error) {
 *     console.error('Request failed:', error);
 *     return null;
 *   }
 * }
 */

/**
 * Example 4: React component with rate limit handling
 *
 * function AnalysisForm() {
 *   const [userApiKey, setUserApiKey] = useState('');
 *   const [rateLimitInfo, setRateLimitInfo] = useState(null);
 *
 *   const analyzeRepo = async (repoUrl) => {
 *     const headers = {
 *       'Content-Type': 'application/json'
 *     };
 *
 *     // Include user API key if provided
 *     if (userApiKey) {
 *       headers['x-anthropic-api-key'] = userApiKey;
 *     }
 *
 *     const response = await fetch('/api/analyze', {
 *       method: 'POST',
 *       headers,
 *       body: JSON.stringify({ repoUrl })
 *     });
 *
 *     // Update rate limit info from headers
 *     setRateLimitInfo({
 *       limit: response.headers.get('X-RateLimit-Limit'),
 *       remaining: response.headers.get('X-RateLimit-Remaining'),
 *       reset: response.headers.get('X-RateLimit-Reset')
 *     });
 *
 *     if (response.status === 429) {
 *       const error = await response.json();
 *       alert(error.message + '\n\n' + error.suggestion);
 *       return;
 *     }
 *
 *     const data = await response.json();
 *     // Handle success...
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         placeholder="Enter your Anthropic API key (optional)"
 *         value={userApiKey}
 *         onChange={(e) => setUserApiKey(e.target.value)}
 *       />
 *       {rateLimitInfo && !userApiKey && (
 *         <p>Requests remaining: {rateLimitInfo.remaining}/{rateLimitInfo.limit}</p>
 *       )}
 *       {userApiKey && <p>Using your API key - no rate limits!</p>}
 *     </div>
 *   );
 * }
 */

export default app;
