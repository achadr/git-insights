# Rate Limiting Documentation

## Overview

GitInsights API implements Redis-backed rate limiting to ensure fair usage and prevent abuse. The rate limiting system supports multiple tiers and allows users to bypass limits by providing their own Anthropic API key.

## Rate Limit Tiers

### Free Tier
- **Limit**: 5 requests per 24 hours
- **Window**: 24 hours (86400000 ms)
- **Storage**: Redis (falls back to memory if Redis unavailable)
- **Applied to**: All unauthenticated requests

### Paid Tier
- **Limit**: 100 requests per 24 hours
- **Window**: 24 hours (86400000 ms)
- **Storage**: Redis (falls back to memory if Redis unavailable)
- **Applied to**: Authenticated paid users (when implemented)

### API Key Bypass
- **Limit**: Unlimited
- **Requirement**: Valid Anthropic API key in `x-anthropic-api-key` header
- **Format**: Must start with `sk-ant-`

## Configuration

### Environment Variables

```bash
# Rate limiting configuration
RATE_LIMIT_FREE_TIER=5              # Free tier request limit
RATE_LIMIT_PAID_TIER=100            # Paid tier request limit
RATE_LIMIT_WINDOW_MS=86400000       # Time window in milliseconds (24 hours)

# Redis configuration for distributed rate limiting
REDIS_URL=redis://localhost:6379
```

### Redis Setup

The rate limiter uses Redis for distributed rate limiting across multiple server instances. If Redis is not available, it automatically falls back to in-memory storage (suitable only for single-instance deployments).

## Usage

### Making API Requests

#### Standard Request (Rate Limited)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/user/repo"
  }'
```

**Response Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

#### Request with User API Key (Bypass Rate Limit)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-anthropic-api-key: sk-ant-api03-your-key-here" \
  -d '{
    "repoUrl": "https://github.com/user/repo"
  }'
```

**Note**: When using your own API key, rate limits are bypassed entirely.

### Rate Limit Response

When rate limit is exceeded, the API returns a 429 status code with detailed information:

```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded the rate limit for this API",
  "details": {
    "limit": 5,
    "current": 6,
    "remaining": 0,
    "resetTime": "2025-10-31T12:00:00.000Z",
    "hoursUntilReset": 18
  },
  "suggestion": "Please wait before making another request, or provide your own Anthropic API key using the x-anthropic-api-key header to bypass rate limits"
}
```

## Implementation Details

### Middleware Chain

The analysis endpoint uses the following middleware chain:

1. **apiKeyBypass** - Checks for user-provided API key
2. **freeTierLimiter** - Applies rate limiting (skipped if API key present)
3. **validateRepoUrl** - Validates request body
4. **analyzeRepository** - Main controller logic

### Key Generator

Rate limits are applied per IP address:
- Uses `x-forwarded-for` header if behind proxy
- Falls back to `req.ip` or `req.connection.remoteAddress`

### Redis Storage

Rate limit data is stored in Redis with the following structure:
- **Prefix**: `gitinsights:ratelimit:`
- **Key Format**: `gitinsights:ratelimit:{ip_address}`
- **TTL**: 24 hours (automatically expires)

### Error Handling

The rate limiter handles Redis connection failures gracefully:
- Logs errors but doesn't crash the server
- Automatically falls back to memory storage
- Continues accepting requests even if Redis is down

## Monitoring

### Health Check Endpoint

Check rate limiter status:

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "rateLimiter": {
    "redisConfigured": true,
    "redisConnected": true,
    "storeType": "redis",
    "freeTierLimit": 5,
    "windowMs": 86400000
  }
}
```

### Logging

Rate limit violations are logged with Winston:

```
2025-10-30 12:00:00 [WARN]: Rate limit exceeded for IP: 192.168.1.1
2025-10-30 12:00:01 [INFO]: Rate limiting bypassed - user provided API key
```

## Best Practices

### For API Consumers

1. **Monitor Headers**: Check `X-RateLimit-Remaining` to track usage
2. **Handle 429s**: Implement exponential backoff for rate limit errors
3. **Use API Keys**: Provide your own Anthropic API key for unlimited access
4. **Cache Results**: Cache analysis results to reduce API calls

### For Developers

1. **Redis Required**: Use Redis in production for distributed deployments
2. **Monitor Connections**: Check Redis connection status in logs
3. **Adjust Limits**: Configure limits based on usage patterns
4. **Test Thoroughly**: Test rate limiting behavior with different tiers

## Testing

Run rate limiter tests:

```bash
npm test rateLimiter.test.js
```

Test rate limiting manually:

```bash
# Test free tier limit (should fail on 6th request)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"repoUrl": "https://github.com/user/repo"}'
  echo "\nRequest $i completed"
done

# Test API key bypass (should succeed for all requests)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -H "x-anthropic-api-key: sk-ant-api03-test" \
    -d '{"repoUrl": "https://github.com/user/repo"}'
  echo "\nRequest $i completed"
done
```

## Troubleshooting

### Redis Connection Issues

**Problem**: Rate limiting not working across multiple instances

**Solution**:
1. Check Redis connection: `redis-cli ping`
2. Verify REDIS_URL in environment variables
3. Check Redis logs for connection errors
4. Ensure Redis is accessible from server network

### Memory Store Fallback

**Problem**: Rate limiting resets on server restart

**Cause**: Using memory store instead of Redis

**Solution**:
1. Configure REDIS_URL environment variable
2. Start Redis server: `redis-server`
3. Verify connection in health check endpoint

### Invalid API Key Format

**Problem**: 400 error when providing API key

**Cause**: API key doesn't start with `sk-ant-`

**Solution**:
1. Verify API key format from Anthropic dashboard
2. Ensure header name is `x-anthropic-api-key`
3. Check for extra whitespace in header value

## Future Enhancements

- [ ] User authentication and paid tier implementation
- [ ] Per-user rate limiting (in addition to IP-based)
- [ ] Dynamic rate limit adjustment based on server load
- [ ] Rate limit analytics dashboard
- [ ] Custom rate limits per API endpoint
- [ ] Burst allowance for short-term spikes
