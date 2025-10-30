# Rate Limiter Quick Start Guide

## 5-Minute Setup

### 1. Install Redis (Choose one method)

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 6379:6379 --name gitinsights-redis redis:alpine
```

**Option B: Local Installation**
```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL2)
sudo apt-get install redis-server
sudo service redis-server start
```

### 2. Configure Environment

Add to your `.env` file:
```bash
REDIS_URL=redis://localhost:6379
RATE_LIMIT_FREE_TIER=5
RATE_LIMIT_WINDOW_MS=86400000
```

### 3. Start the Server

```bash
cd backend
npm install  # Installs rate-limit-redis automatically
npm run dev
```

### 4. Test It Works

**Check health:**
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "rateLimiter": {
    "redisConfigured": true,
    "redisConnected": true,
    "storeType": "redis",
    "freeTierLimit": 5,
    "windowMs": 86400000
  }
}
```

## Usage Examples

### Example 1: Standard Request (Rate Limited)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/microsoft/vscode"}'
```

**Check headers in response:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1730419200
```

### Example 2: Request with API Key (Bypasses Rate Limit)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-anthropic-api-key: sk-ant-api03-YOUR-KEY-HERE" \
  -d '{"repoUrl": "https://github.com/microsoft/vscode"}'
```

**No rate limit applied!** Can make unlimited requests.

### Example 3: Test Rate Limiting

```bash
# Run this to hit the rate limit
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"repoUrl": "https://github.com/test/repo"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

**Expected:**
- Requests 1-5: 200 OK
- Request 6: 429 Too Many Requests

## Frontend Integration

### React Example

```jsx
import { useState } from 'react';

function AnalysisForm() {
  const [apiKey, setApiKey] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const analyzeRepo = async (repoUrl) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if user provided one
    if (apiKey) {
      headers['x-anthropic-api-key'] = apiKey;
    }

    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ repoUrl })
    });

    // Extract rate limit info from headers
    if (!apiKey) {
      setRateLimitInfo({
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining')
      });
    }

    if (response.status === 429) {
      const error = await response.json();
      alert(`Rate limit exceeded! ${error.details.hoursUntilReset} hours until reset`);
      return;
    }

    return await response.json();
  };

  return (
    <div>
      <input
        type="password"
        placeholder="Anthropic API Key (optional)"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      {rateLimitInfo && !apiKey && (
        <p>Requests: {rateLimitInfo.remaining}/{rateLimitInfo.limit} remaining</p>
      )}

      {apiKey && (
        <p style={{ color: 'green' }}>✓ Using your API key - unlimited requests</p>
      )}
    </div>
  );
}
```

### JavaScript/Fetch Example

```javascript
async function analyzeWithRateLimit(repoUrl, userApiKey = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (userApiKey) {
    headers['x-anthropic-api-key'] = userApiKey;
  }

  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ repoUrl })
    });

    // Check rate limit status
    const remaining = response.headers.get('X-RateLimit-Remaining');
    console.log(`Requests remaining: ${remaining}`);

    if (response.status === 429) {
      const error = await response.json();
      console.error('Rate limited:', error.details);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

// Usage
analyzeWithRateLimit('https://github.com/user/repo');

// With API key (no rate limit)
analyzeWithRateLimit('https://github.com/user/repo', 'sk-ant-api03-...');
```

## Common Issues

### Issue: "Using in-memory rate limit store"

**Cause:** Redis is not running or not accessible

**Fix:**
1. Start Redis: `redis-server` or `docker start gitinsights-redis`
2. Check connection: `redis-cli ping` (should return PONG)
3. Verify REDIS_URL in .env

### Issue: Rate limit resets on server restart

**Cause:** Using memory store instead of Redis

**Fix:**
1. Configure REDIS_URL in .env
2. Ensure Redis is running
3. Restart server

### Issue: "Invalid API Key" error

**Cause:** API key format is incorrect

**Fix:**
- API keys must start with `sk-ant-`
- Check for typos or extra spaces
- Verify key from Anthropic dashboard

## Production Deployment

### Environment Variables

```bash
# Production .env
REDIS_URL=redis://your-redis-host:6379
# OR for Redis with auth
REDIS_URL=redis://:password@your-redis-host:6379

RATE_LIMIT_FREE_TIER=5
RATE_LIMIT_PAID_TIER=100
RATE_LIMIT_WINDOW_MS=86400000

NODE_ENV=production
```

### Redis Recommendations

1. **Use managed Redis service:**
   - AWS ElastiCache
   - Redis Cloud
   - Azure Cache for Redis
   - Google Cloud Memorystore

2. **Enable persistence:**
   ```bash
   # In redis.conf
   save 900 1
   save 300 10
   save 60 10000
   ```

3. **Monitor connection:**
   - Check `/api/health` endpoint
   - Set up alerts for Redis disconnections
   - Monitor memory usage

4. **Secure connection:**
   - Use TLS/SSL for Redis connection
   - Enable authentication
   - Use VPC/private network

## Monitoring

### Check Rate Limiter Status

```bash
# Health check
curl http://localhost:3000/api/health | jq '.rateLimiter'
```

### Monitor Redis

```bash
# Check Redis info
redis-cli info stats

# Monitor commands in real-time
redis-cli monitor

# Check rate limit keys
redis-cli keys "gitinsights:ratelimit:*"

# Check specific IP's rate limit
redis-cli get "gitinsights:ratelimit:192.168.1.1"
```

### View Logs

```bash
# Start server with logging
npm run dev

# Watch for rate limit events
tail -f logs/app.log | grep "rate limit"
```

## Testing Checklist

- [ ] Redis is running
- [ ] Health endpoint returns "redisConnected": true
- [ ] Standard requests show rate limit headers
- [ ] Requests with API key bypass rate limiting
- [ ] 6th request returns 429 error
- [ ] Error message includes retry information
- [ ] Rate limit resets after 24 hours (or configured window)
- [ ] Server gracefully shuts down Redis connection

## Need Help?

1. Check logs: `npm run dev` shows detailed logging
2. Test Redis: `redis-cli ping`
3. Check health: `curl http://localhost:3000/api/health`
4. Review docs: `backend/RATE_LIMITING.md`
5. See examples: `backend/examples/rate-limiter-usage.js`

## Next Steps

After basic setup:
1. ✅ Test with real repository URLs
2. ✅ Integrate with frontend
3. ✅ Test API key bypass functionality
4. ✅ Configure production Redis
5. ✅ Set up monitoring/alerting
6. ✅ Load test rate limiting

You're ready to go! 🚀
