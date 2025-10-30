# Server-Sent Events (SSE) Implementation

## Overview

The SSE implementation provides real-time progress updates during repository analysis. This allows clients to track the analysis process as it happens, rather than waiting for the entire process to complete.

## Endpoints

### POST `/api/analyze/stream`

Server-Sent Events endpoint that streams real-time progress updates during repository analysis.

#### Request

**Headers:**
- `Content-Type: application/json`
- `x-anthropic-api-key` (optional): User's Anthropic API key to bypass rate limits

**Body:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "fileLimit": 10,
  "apiKey": "sk-ant-..." // Optional, can use header instead
}
```

#### Response

**Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Event Format:**

Each SSE event is a JSON object with the following structure:

```json
{
  "stage": "stage_name",
  "message": "Human-readable message",
  "progress": 50,
  "current": 5,
  "total": 10,
  "data": {}
}
```

## Event Stages

### 1. `connected`
Sent immediately when connection is established.

```json
{
  "stage": "connected",
  "message": "Connected to analysis stream",
  "progress": 0
}
```

### 2. `validation`
Repository URL is being validated.

```json
{
  "stage": "validation",
  "message": "Validating repository URL",
  "progress": 5
}
```

### 3. `parsing`
Parsing the GitHub repository URL.

```json
{
  "stage": "parsing",
  "message": "Parsing repository URL",
  "progress": 10
}
```

### 4. `fetching_tree`
Fetching the repository file tree from GitHub.

```json
{
  "stage": "fetching_tree",
  "message": "Fetching repository file tree",
  "progress": 15
}
```

### 5. `tree_fetched`
File tree has been fetched successfully.

```json
{
  "stage": "tree_fetched",
  "message": "Found 42 code files",
  "progress": 25,
  "data": {
    "totalCodeFiles": 42
  }
}
```

### 6. `analysis_starting`
About to start analyzing files.

```json
{
  "stage": "analysis_starting",
  "message": "Starting analysis of 10 files",
  "progress": 30,
  "data": {
    "filesToAnalyze": 10
  }
}
```

### 7. `analyzing_file`
Analyzing a specific file (sent for each file).

```json
{
  "stage": "analyzing_file",
  "message": "Analyzing src/index.js",
  "progress": 45,
  "current": 3,
  "total": 10,
  "data": {
    "fileName": "src/index.js"
  }
}
```

### 8. `file_error`
Failed to analyze a specific file (non-fatal).

```json
{
  "stage": "file_error",
  "message": "Failed to analyze src/broken.js",
  "progress": 50,
  "current": 4,
  "total": 10,
  "data": {
    "fileName": "src/broken.js",
    "error": "File not found"
  }
}
```

### 9. `generating_report`
Generating the final analysis report.

```json
{
  "stage": "generating_report",
  "message": "Generating analysis report",
  "progress": 95
}
```

### 10. `cached`
Returning cached analysis result (bypasses analysis).

```json
{
  "stage": "cached",
  "message": "Returning cached analysis",
  "progress": 100
}
```

### 11. `complete`
Analysis completed successfully with full results.

```json
{
  "stage": "complete",
  "message": "Analysis complete",
  "progress": 100,
  "data": {
    "summary": {
      "filesAnalyzed": 10,
      "overallQuality": 85,
      "requestedFileLimit": 10,
      "totalCodeFiles": 42,
      "timestamp": "2025-01-15T10:30:00.000Z"
    },
    "quality": {
      "score": 85,
      "issueCount": 15,
      "topIssues": [...]
    },
    "files": [...]
  }
}
```

### 12. `error`
Analysis failed with error details.

```json
{
  "stage": "error",
  "message": "Repository not found",
  "progress": 0,
  "data": {
    "error": "Repository not found",
    "code": "REPO_NOT_FOUND"
  }
}
```

## Client Implementation Example

### JavaScript (Fetch API + EventSource polyfill)

Since EventSource doesn't support POST requests, you need to use fetch with streaming:

```javascript
async function analyzeWithProgress(repoUrl, fileLimit = 10) {
  const response = await fetch('/api/analyze/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repoUrl, fileLimit })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // Keep incomplete message in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        handleProgressEvent(data);
      }
    }
  }
}

function handleProgressEvent(event) {
  console.log(`[${event.stage}] ${event.message} - ${event.progress}%`);

  if (event.stage === 'complete') {
    console.log('Analysis complete!', event.data);
  } else if (event.stage === 'error') {
    console.error('Analysis failed:', event.data.error);
  }
}
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useAnalysisStream(repoUrl, fileLimit = 10) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!repoUrl) return;

    let reader;

    const startAnalysis = async () => {
      try {
        const response = await fetch('/api/analyze/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl, fileLimit })
        });

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const event = JSON.parse(line.substring(6));

              setStage(event.stage);
              setMessage(event.message);
              setProgress(event.progress || 0);

              if (event.stage === 'complete') {
                setResult(event.data);
              } else if (event.stage === 'error') {
                setError(event.data);
              }
            }
          }
        }
      } catch (err) {
        setError({ error: err.message, code: 'CLIENT_ERROR' });
      }
    };

    startAnalysis();

    return () => {
      if (reader) reader.cancel();
    };
  }, [repoUrl, fileLimit]);

  return { progress, stage, message, result, error };
}
```

## Architecture

### Service Layer (`analyzerService.js`)

The analyzer service was modified to accept an optional `progressCallback` parameter:

```javascript
async analyzeRepository(repoUrl, userApiKey = null, fileLimit = 10, progressCallback = null)
```

The callback is invoked at each stage of the analysis process:
- Repository validation
- URL parsing
- Fetching file tree
- For each file being analyzed
- Report generation

### Controller Layer (`analysisController.js`)

The controller sets up SSE headers and creates a progress callback that sends events:

```javascript
export const analyzeRepositoryStream = async (req, res, next) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Progress callback
  const progressCallback = (progressData) => {
    sendSSEEvent(res, progressData);
  };

  // Perform analysis
  const result = await analyzerService.analyzeRepository(
    repoUrl,
    userApiKey,
    fileLimit,
    progressCallback
  );
}
```

### Route Layer (`routes/analysis.js`)

The new route applies the same middleware as the standard REST endpoint:

```javascript
router.post('/analyze/stream',
  apiKeyBypass,      // Check for user API key
  freeTierLimiter,   // Apply rate limiting
  validateRepoUrl,   // Validate request body
  analyzeRepositoryStream
);
```

## Security Considerations

1. **Rate Limiting**: SSE endpoint uses the same rate limiting as the REST endpoint
2. **Authentication**: Same API key validation and bypass logic
3. **Input Validation**: Same Joi schema validation
4. **Connection Limits**: Long-lived connections are automatically closed after completion
5. **Error Handling**: Errors are sent via SSE and connection is closed gracefully

## Performance

- **Memory**: Minimal overhead as events are sent immediately, not buffered
- **Network**: Efficient - only sends data when progress updates occur
- **CPU**: Same as REST endpoint - no additional processing overhead
- **Caching**: Cached results still work - single event sent with cached data

## Testing

### Manual Testing

1. Start the server: `npm start`
2. Run test script: `node test-sse.js`
3. Observe real-time progress updates

### Automated Testing

```javascript
import request from 'supertest';
import app from '../src/index.js';

describe('SSE Analysis Endpoint', () => {
  it('should stream progress events', (done) => {
    const events = [];

    request(app)
      .post('/api/analyze/stream')
      .send({ repoUrl: 'https://github.com/octocat/Hello-World', fileLimit: 3 })
      .expect('Content-Type', 'text/event-stream')
      .buffer()
      .parse((res, callback) => {
        res.on('data', (chunk) => {
          const lines = chunk.toString().split('\n\n');
          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              events.push(JSON.parse(line.substring(6)));
            }
          });
        });
        res.on('end', () => callback(null, events));
      })
      .end((err, res) => {
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].stage).toBe('connected');
        expect(events[events.length - 1].stage).toBe('complete');
        done();
      });
  });
});
```

## Backward Compatibility

The original REST endpoint (`/api/analyze`) remains unchanged and continues to work as before. Clients can choose which endpoint to use based on their needs:

- Use `/api/analyze` for simple request-response pattern
- Use `/api/analyze/stream` for real-time progress tracking

## Future Enhancements

1. **Heartbeat**: Add periodic heartbeat events to detect disconnections
2. **Cancellation**: Allow clients to cancel in-progress analysis
3. **Multiple Stages**: Add more granular progress stages
4. **File-level Details**: Stream individual file analysis results as they complete
5. **Metrics**: Add timing information for each stage
