# SSE Quick Reference Card

## Endpoint

```
POST /api/analyze/stream
```

## Request

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "fileLimit": 10
}
```

**Optional Header:**
```
x-anthropic-api-key: sk-ant-...
```

## Response Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## Event Format

```json
{
  "stage": "string",
  "message": "string",
  "progress": 0-100,
  "current": 1,
  "total": 10,
  "data": {}
}
```

## All Event Stages

| Stage | Progress | When |
|-------|----------|------|
| `connected` | 0% | Connection established |
| `validation` | 5% | Validating URL |
| `parsing` | 10% | Parsing URL |
| `fetching_tree` | 15% | Getting files from GitHub |
| `tree_fetched` | 25% | Files retrieved |
| `analysis_starting` | 30% | Starting analysis |
| `analyzing_file` | 30-95% | Analyzing each file |
| `file_error` | varies | File failed (non-fatal) |
| `generating_report` | 95% | Creating report |
| `cached` | 100% | Returning cache |
| `complete` | 100% | Done! |
| `error` | 0% | Fatal error |

## Minimal Client Code

```javascript
const res = await fetch('/api/analyze/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ repoUrl, fileLimit: 10 })
});

const reader = res.body.getReader();
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

      // Update UI
      if (event.stage === 'complete') {
        console.log('Done!', event.data);
      }
    }
  }
}
```

## Important Event Properties

### All Events Have:
- `stage` - Current stage name
- `message` - Human-readable message
- `progress` - 0-100 percentage

### File Analysis Events Have:
- `current` - Current file number (1-based)
- `total` - Total files to analyze
- `data.fileName` - Name of file being analyzed

### Complete Event Has:
- `data` - Full analysis result object

### Error Event Has:
- `data.error` - Error message
- `data.code` - Error code

## Common Patterns

### Update Progress Bar
```javascript
if (event.progress !== undefined) {
  progressBar.style.width = `${event.progress}%`;
  progressText.textContent = event.message;
}
```

### Show File Counter
```javascript
if (event.current && event.total) {
  fileCounter.textContent = `${event.current}/${event.total}`;
}
```

### Handle Completion
```javascript
if (event.stage === 'complete') {
  showResults(event.data);
}
```

### Handle Errors
```javascript
if (event.stage === 'error') {
  showError(event.data.error);
}
```

## Error Codes

- `ANALYSIS_ERROR` - Analysis failed
- `CLIENT_ERROR` - Network/client error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `REPO_NOT_FOUND` - Repository not found
- `INVALID_API_KEY` - Bad API key

## Tips

1. **Buffer Management:** Always keep incomplete lines in buffer
2. **Progress Updates:** Debounce UI updates (every 100ms)
3. **Error Handling:** Always handle `error` stage
4. **Cleanup:** Close reader on unmount
5. **API Key:** Use header for rate limit bypass

## Testing

Test with curl:
```bash
curl -X POST http://localhost:3000/api/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/octocat/Hello-World","fileLimit":3}'
```

Or use the test script:
```bash
node test-sse.js
```

## Full Docs

- Technical: `SSE_IMPLEMENTATION.md`
- Integration: `FRONTEND_INTEGRATION.md`
- Summary: `SSE_IMPLEMENTATION_SUMMARY.md`
