---
name: api-builder
description: Builds RESTful API endpoints with Express.js following best practices
allowed_tools: [Write, Read, Edit, Bash]
---

# API Builder Skill

I create well-structured, production-ready REST APIs with Express.js.

## API Design Principles

### 1. RESTful Structure
```
GET    /api/resource         - List all
GET    /api/resource/:id     - Get one
POST   /api/resource         - Create
PUT    /api/resource/:id     - Update
DELETE /api/resource/:id     - Delete
```

### 2. Response Format
```javascript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### 3. Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Server Error

## File Structure
```
routes/
  └── analysis.js         - Route definitions
controllers/
  └── analysisController.js  - Business logic
services/
  └── analysisService.js     - Data operations
middleware/
  └── validator.js        - Input validation
```

## Implementation Pattern

### Step 1: Route
```javascript
// routes/analysis.js
import express from 'express';
import * as controller from '../controllers/analysisController.js';
import { validateRepoUrl } from '../middleware/validator.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/analyze',
  rateLimiter,
  validateRepoUrl,
  controller.analyzeRepository
);

export default router;
```

### Step 2: Controller
```javascript
// controllers/analysisController.js
import * as service from '../services/analysisService.js';
import logger from '../utils/logger.js';

export async function analyzeRepository(req, res, next) {
  try {
    const { repoUrl, apiKey } = req.body;
    
    logger.info('Analysis requested', { repoUrl });
    
    const result = await service.analyzeRepo(repoUrl, apiKey);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    next(error);
  }
}
```

### Step 3: Service
```javascript
// services/analysisService.js
import githubService from './githubService.js';
import claudeService from './claudeService.js';
import cacheService from './cacheService.js';

export async function analyzeRepo(repoUrl, userApiKey) {
  // Check cache
  const cached = await cacheService.getAnalysisCache(repoUrl);
  if (cached) {
    return cached;
  }
  
  // Fetch repository
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const files = await githubService.getRepoFiles(owner, repo);
  
  // Analyze with Claude
  const analysis = await claudeService.analyze(
    files,
    userApiKey
  );
  
  // Cache results
  await cacheService.cacheAnalysis(repoUrl, analysis);
  
  return analysis;
}
```

### Step 4: Validation Middleware
```javascript
// middleware/validator.js
import Joi from 'joi';

const schemas = {
  analyzeRepo: Joi.object({
    repoUrl: Joi.string()
      .uri()
      .pattern(/github\.com/)
      .required()
      .messages({
        'string.pattern.base': 'Must be a valid GitHub URL',
      }),
    apiKey: Joi.string().optional(),
  }),
};

export function validateRepoUrl(req, res, next) {
  const { error } = schemas.analyzeRepo.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
        code: 'VALIDATION_ERROR',
      },
    });
  }
  
  next();
}
```

### Step 5: Error Handler
```javascript
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  // Log error
  console.error(err);
  
  // Known errors
  if (err.message === 'Repository not found') {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Repository not found',
        code: 'REPO_NOT_FOUND',
      },
    });
  }
  
  if (err.message === 'Rate limit exceeded') {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Rate limit exceeded. Try again later.',
        code: 'RATE_LIMIT',
      },
    });
  }
  
  // Unknown errors
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
```

## Best Practices

### 1. Input Validation
- Always validate user input
- Use Joi for schema validation
- Return clear error messages

### 2. Error Handling
- Try-catch in all async functions
- Use next(error) to pass to error handler
- Never expose internal errors to users

### 3. Logging
- Log all requests
- Log errors with context
- Use structured logging

### 4. Security
- Rate limiting on all endpoints
- CORS configuration
- Helmet for security headers
- Input sanitization

### 5. Performance
- Cache responses where possible
- Use async/await consistently
- Implement timeouts
- Handle large payloads

## Testing

### Unit Test Example
```javascript
// tests/services/analysisService.test.js
import { analyzeRepo } from '../../src/services/analysisService.js';
import cacheService from '../../src/services/cacheService.js';

jest.mock('../../src/services/cacheService.js');

describe('analysisService', () => {
  describe('analyzeRepo', () => {
    it('should return cached result if available', async () => {
      const cachedData = { score: 85 };
      cacheService.getAnalysisCache.mockResolvedValue(cachedData);
      
      const result = await analyzeRepo('https://github.com/test/repo');
      
      expect(result).toEqual(cachedData);
    });
  });
});
```

### Integration Test Example
```javascript
// tests/routes/analysis.test.js
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/analyze', () => {
  it('should analyze a repository', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ repoUrl: 'https://github.com/test/repo' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('quality');
  });
  
  it('should return 400 for invalid URL', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ repoUrl: 'invalid-url' })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});
```

## Common Patterns

### Pagination
```javascript
export async function listRepositories(req, res) {
  const { page = 1, limit = 10 } = req.query;
  
  const offset = (page - 1) * limit;
  const repos = await service.getRepos(limit, offset);
  const total = await service.countRepos();
  
  res.json({
    success: true,
    data: {
      items: repos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}
```

### File Upload
```javascript
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  // Process file
});
```

### Async Error Wrapper
```javascript
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get('/test', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```