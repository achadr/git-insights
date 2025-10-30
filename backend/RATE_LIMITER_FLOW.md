# Rate Limiter Flow Diagram

## Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Request                              │
│         POST /api/analyze                                        │
│         Headers: x-anthropic-api-key (optional)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express Middleware Chain                        │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: apiKeyBypass Middleware                                │
│  ─────────────────────────────────────────────────────────────  │
│  1. Check for x-anthropic-api-key header                        │
│  2. If present:                                                 │
│     ├─ Validate format (starts with sk-ant-)                    │
│     ├─ If invalid → Return 400 Bad Request                      │
│     └─ If valid → Store in req.userAnthropicApiKey              │
│  3. Continue to next middleware                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: freeTierLimiter Middleware                             │
│  ─────────────────────────────────────────────────────────────  │
│  1. Check skip condition:                                       │
│     └─ If req has userAnthropicApiKey → SKIP (bypass)           │
│  2. Generate key from IP address                                │
│  3. Query Redis store:                                          │
│     ├─ Get current count for this IP                            │
│     └─ Check if under limit (5 requests/24h)                    │
│  4. If under limit:                                             │
│     ├─ Increment counter                                        │
│     ├─ Add rate limit headers to response                       │
│     └─ Continue to next middleware                              │
│  5. If over limit:                                              │
│     └─ Return 429 Too Many Requests                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: validateRepoUrl Middleware                             │
│  ─────────────────────────────────────────────────────────────  │
│  1. Validate request body                                       │
│  2. If invalid → Return 400 Bad Request                         │
│  3. If valid → Continue                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: analyzeRepository Controller                           │
│  ─────────────────────────────────────────────────────────────  │
│  1. Extract userApiKey from req.userAnthropicApiKey or body     │
│  2. Call analyzerService.analyzeRepository(url, userApiKey)     │
│  3. Return results                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer (analyzerService)                                │
│  ─────────────────────────────────────────────────────────────  │
│  1. Fetch repository files                                      │
│  2. For each file:                                              │
│     └─ Call claudeService.analyze(prompt, code, userApiKey)     │
│  3. Aggregate results                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Claude Service                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  1. If userApiKey provided:                                     │
│     └─ Create new Anthropic client with user's key              │
│  2. Else:                                                       │
│     └─ Use default client with server's key                     │
│  3. Make API call to Claude                                     │
│  4. Return analysis results                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Response to Client                            │
│  ────────────────────────────────────────────────────────────   │
│  Headers:                                                       │
│    X-RateLimit-Limit: 5                                         │
│    X-RateLimit-Remaining: 3                                     │
│    X-RateLimit-Reset: 1730332800                                │
│                                                                 │
│  Body:                                                          │
│    { success: true, data: {...} }                               │
└─────────────────────────────────────────────────────────────────┘
```

## Rate Limit Scenarios

### Scenario 1: Free Tier User (No API Key)

```
Request #1 → ✅ Success (4 remaining)
Request #2 → ✅ Success (3 remaining)
Request #3 → ✅ Success (2 remaining)
Request #4 → ✅ Success (1 remaining)
Request #5 → ✅ Success (0 remaining)
Request #6 → ❌ 429 Too Many Requests

Response:
{
  "error": "Too Many Requests",
  "details": {
    "limit": 5,
    "remaining": 0,
    "resetTime": "2025-10-31T00:00:00.000Z",
    "hoursUntilReset": 18
  }
}
```

### Scenario 2: User with API Key (Bypass)

```
Request #1 → ✅ Success (bypassed, no limit)
Request #2 → ✅ Success (bypassed, no limit)
Request #3 → ✅ Success (bypassed, no limit)
...
Request #100 → ✅ Success (bypassed, no limit)

Note: No rate limit headers in response when bypassed
```

### Scenario 3: Paid Tier User

```
100 requests/24h limit instead of 5
Same flow but higher limit
```

## Redis Storage Structure

```
Redis Key Format: gitinsights:ratelimit:{ip_address}

Example:
┌──────────────────────────────────────────┐
│ Key: gitinsights:ratelimit:192.168.1.1   │
├──────────────────────────────────────────┤
│ Value: 3                                 │
│ TTL: 82800 seconds (23 hours)            │
└──────────────────────────────────────────┘

Redis Operations:
1. GET gitinsights:ratelimit:{ip} → Returns current count
2. INCR gitinsights:ratelimit:{ip} → Increments count
3. EXPIRE gitinsights:ratelimit:{ip} 86400 → Set TTL to 24 hours
```

## Error Handling Flow

### Redis Connection Error

```
┌─────────────────────────────────────────┐
│  Redis Connection Attempt               │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌──────────────┐
       │ Success?     │
       └──────┬───────┘
              │
        ┌─────┴─────┐
        │           │
       Yes          No
        │           │
        ▼           ▼
  ┌──────────┐  ┌──────────────────┐
  │Use Redis │  │Log Error         │
  │Store     │  │Fall back to      │
  └──────────┘  │Memory Store      │
                │Continue Operating│
                └──────────────────┘

Result: System continues to function
- Rate limiting still works (memory-based)
- Not suitable for multi-instance deployments
- Automatically reconnects when Redis available
```

### Invalid API Key Format

```
Request with x-anthropic-api-key: invalid-format
                │
                ▼
         ┌──────────────┐
         │ Validate Key │
         │ Format       │
         └──────┬───────┘
                │
                ▼
      ┌─────────────────┐
      │ Starts with      │
      │ "sk-ant-"?      │
      └─────┬───────────┘
            │
           No
            │
            ▼
    ┌───────────────────┐
    │ Return 400        │
    │ Bad Request       │
    │                   │
    │ {                 │
    │   error: "Invalid │
    │   API Key"        │
    │ }                 │
    └───────────────────┘
```

## Monitoring & Observability Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    GET /api/health                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Call                 │
              │ getRateLimiterStatus()│
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ Check:                            │
         │ - Redis configured?               │
         │ - Redis connected?                │
         │ - Current store type              │
         │ - Free tier limit                 │
         │ - Window duration                 │
         └───────────────┬───────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Return Status JSON   │
              └──────────────────────┘

Response:
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

## Graceful Shutdown Flow

```
┌────────────────────────────────────┐
│  SIGTERM or SIGINT Signal Received │
└──────────────┬─────────────────────┘
               │
               ▼
      ┌────────────────────┐
      │ Stop accepting new │
      │ HTTP connections   │
      └──────────┬─────────┘
                 │
                 ▼
      ┌────────────────────┐
      │ Wait for pending   │
      │ requests to finish │
      └──────────┬─────────┘
                 │
                 ▼
      ┌────────────────────┐
      │ Close HTTP server  │
      └──────────┬─────────┘
                 │
                 ▼
      ┌────────────────────┐
      │ Call cleanup()     │
      │ - Close Redis conn │
      │ - Flush pending    │
      └──────────┬─────────┘
                 │
                 ▼
      ┌────────────────────┐
      │ Exit process (0)   │
      └────────────────────┘

Timeout: Force exit after 10 seconds
```

## Integration with Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Component                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
      User has API key?             No API key
           │                             │
          Yes                            │
           │                             │
           ▼                             ▼
┌──────────────────────┐    ┌──────────────────────────┐
│ Include header:      │    │ Make standard request    │
│ x-anthropic-api-key  │    │ Check X-RateLimit-*      │
│                      │    │ headers in response      │
│ Benefits:            │    │                          │
│ - No rate limits     │    │ Show remaining:          │
│ - Uses user's quota  │    │ "3/5 requests left"      │
│ - Faster processing  │    │                          │
└──────────────────────┘    └──────────┬───────────────┘
           │                            │
           │                            │
           ▼                            ▼
       ┌────────────────────────────────────┐
       │  If 429 error:                     │
       │  - Show error message              │
       │  - Display hours until reset       │
       │  - Suggest using API key           │
       │  - Prompt for API key input        │
       └────────────────────────────────────┘
```
