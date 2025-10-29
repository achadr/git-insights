---
description: Integrate a new external API or service
allowed_tools: [Write, Read, Edit, Bash]
---

# Integrate API Command

Add a new external API integration to the project.

## Integration Steps

### 1. Plan Integration

Determine:
- What API are we integrating?
- Authentication method (API key, OAuth, etc.)
- Rate limits
- Endpoints needed
- Data transformations required
- Caching strategy
- Error handling

### 2. Create Service File
````javascript
// services/[serviceName]Service.js
import axios from 'axios';

class ServiceNameService {
  constructor() {
    this.baseURL = process.env.SERVICE_API_URL;
    this.apiKey = process.env.SERVICE_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async getData(params) {
    try {
      const response = await this.client.get('/endpoint', { params });
      return this.transformResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  transformResponse(data) {
    // Transform API response to our format
    return {
      // ...
    };
  }

  handleError(error) {
    if (error.response?.status === 429) {
      return new Error('Rate limit exceeded');
    }
    if (error.response?.status === 401) {
      return new Error('Authentication failed');
    }
    return new Error(`API error: ${error.message}`);
  }
}

export default new ServiceNameService();
````

### 3. Add Environment Variables
````bash
# .env
SERVICE_API_URL=https://api.example.com
SERVICE_API_KEY=your_api_key_here
````
````bash
# .env.example
SERVICE_API_URL=https://api.example.com
SERVICE_API_KEY=your_api_key_here
````

### 4. Implement Caching
````javascript
import cacheService from './cacheService.js';

async getData(params) {
  // Check cache
  const cacheKey = `service:${JSON.stringify(params)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const data = await this.fetchFromAPI(params);

  // Cache result
  await cacheService.set(cacheKey, data, 3600); // 1 hour

  return data;
}
````

### 5. Add Rate Limiting
````javascript
class ServiceNameService {
  constructor() {
    this.lastRequest = 0;
    this.minDelay = 1000; // 1 second between requests
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      const delay = this.minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
  }

  async getData(params) {
    await this.rateLimit();
    // Make request...
  }
}
````

### 6. Add Retry Logic
````javascript
async retryRequest(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors
      if (error.response?.status < 500) {
        throw error;
      }
      
      // Last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async getData(params) {
  return await this.retryRequest(() => 
    this.client.get('/endpoint', { params })
  );
}
````

### 7. Create Tests
````javascript
// tests/services/serviceNameService.test.js
import serviceNameService from '../../src/services/serviceNameService';

jest.mock('axios');

describe('ServiceNameService', () => {
  describe('getData', () => {
    it('should fetch and transform data', async () => {
      const mockData = { /* ... */ };
      axios.get.mockResolvedValue({ data: mockData });
      
      const result = await serviceNameService.getData({ id: 1 });
      
      expect(result).toHaveProperty('transformedField');
    });
    
    it('should handle errors', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));
      
      await expect(
        serviceNameService.getData({ id: 1 })
      ).rejects.toThrow('API error');
    });
  });
});
````

### 8. Add to Controller
````javascript
// controllers/dataController.js
import serviceNameService from '../services/serviceNameService.js';

export async function getData(req, res, next) {
  try {
    const { param } = req.query;
    const data = await serviceNameService.getData({ param });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
````

### 9. Document API
````markdown
# Service Name API Integration

## Endpoints

### GET /api/data
Fetches data from Service Name API

**Query Parameters:**
- `param` (string, required): Description

**Response:**
```json
{
  "data": {
    "field1": "value",
    "field2": 123
  }
}
```

**Errors:**
- 429: Rate limit exceeded
- 401: Authentication failed
- 500: API error
````

## Common Integration Patterns

### REST API
````javascript
class RestAPIService {
  async get(endpoint, params) {
    return await this.client.get(endpoint, { params });
  }
  
  async post(endpoint, data) {
    return await this.client.post(endpoint, data);
  }
  
  async put(endpoint, data) {
    return await this.client.put(endpoint, data);
  }
  
  async delete(endpoint) {
    return await this.client.delete(endpoint);
  }
}
````

### GraphQL API
````javascript
class GraphQLService {
  async query(query, variables) {
    const response = await this.client.post('/graphql', {
      query,
      variables,
    });
    return response.data.data;
  }
}
````

### WebSocket API
````javascript
class WebSocketService {
  connect() {
    this.ws = new WebSocket(this.wsURL);
    
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
    
    this.ws.onerror = (error) => {
      this.handleError(error);
    };
  }
  
  send(message) {
    this.ws.send(JSON.stringify(message));
  }
}
````

## Checklist

- [ ] Service file created
- [ ] Environment variables added
- [ ] Authentication implemented
- [ ] Error handling added
- [ ] Rate limiting implemented
- [ ] Caching strategy defined
- [ ] Retry logic added
- [ ] Tests written
- [ ] Controller integrated
- [ ] Documentation updated
- [ ] Tested with real API

## Security Considerations

1. **Never commit API keys**: Use environment variables
2. **Validate responses**: Check data structure
3. **Sanitize input**: Prevent injection attacks
4. **Use HTTPS**: Encrypt data in transit
5. **Implement timeouts**: Prevent hanging requests
6. **Log carefully**: Don't log sensitive data
7. **Handle rate limits**: Respect API limits
8. **Monitor usage**: Track API calls and costs