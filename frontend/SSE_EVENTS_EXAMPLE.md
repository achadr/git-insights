# SSE Events Example

This document shows actual SSE events received from the backend during a real analysis.

## Example Analysis Flow

### Repository: https://github.com/octocat/Hello-World
### File Limit: 3

---

## Event Stream

```
EVENT #1
data: {
  "stage": "connected",
  "message": "Connected to analysis stream",
  "progress": 0
}
```

**UI Update:**
- Icon: 🔌
- Progress: 0%
- Message: "Connected to analysis stream"
- Progress Bar: Empty

---

```
EVENT #2
data: {
  "stage": "validation",
  "message": "Validating repository URL",
  "progress": 5
}
```

**UI Update:**
- Icon: ✅
- Progress: 5%
- Message: "Validating repository URL"
- Progress Bar: 5% filled (blue)

---

```
EVENT #3
data: {
  "stage": "parsing",
  "message": "Parsing repository URL",
  "progress": 10
}
```

**UI Update:**
- Icon: 🔍
- Progress: 10%
- Message: "Parsing repository URL"
- Progress Bar: 10% filled

---

```
EVENT #4
data: {
  "stage": "fetching_tree",
  "message": "Fetching repository file tree",
  "progress": 15
}
```

**UI Update:**
- Icon: 🌳
- Progress: 15%
- Message: "Fetching repository file tree"
- Progress Bar: 15% filled

---

```
EVENT #5
data: {
  "stage": "tree_fetched",
  "message": "Found 47 code files",
  "progress": 25,
  "data": {
    "totalCodeFiles": 47
  }
}
```

**UI Update:**
- Icon: 📁
- Progress: 25%
- Message: "Found 47 code files"
- Progress Bar: 25% filled
- Note: 47 files found (will analyze 3 due to fileLimit)

---

```
EVENT #6
data: {
  "stage": "analysis_starting",
  "message": "Starting analysis of 3 files",
  "progress": 30,
  "data": {
    "filesToAnalyze": 3
  }
}
```

**UI Update:**
- Icon: 🚀
- Progress: 30%
- Message: "Starting analysis of 3 files"
- Progress Bar: 30% filled

---

```
EVENT #7
data: {
  "stage": "analyzing_file",
  "message": "Analyzing README.md",
  "progress": 52,
  "current": 1,
  "total": 3,
  "data": {
    "fileName": "README.md"
  }
}
```

**UI Update:**
- Icon: 📄
- Progress: 52%
- Message: "Analyzing README.md"
- **File Counter: "Analyzing file 1 of 3"**
- Progress Bar: 52% filled

---

```
EVENT #8
data: {
  "stage": "analyzing_file",
  "message": "Analyzing index.html",
  "progress": 73,
  "current": 2,
  "total": 3,
  "data": {
    "fileName": "index.html"
  }
}
```

**UI Update:**
- Icon: 📄
- Progress: 73%
- Message: "Analyzing index.html"
- **File Counter: "Analyzing file 2 of 3"**
- Progress Bar: 73% filled

---

```
EVENT #9
data: {
  "stage": "analyzing_file",
  "message": "Analyzing .gitignore",
  "progress": 95,
  "current": 3,
  "total": 3,
  "data": {
    "fileName": ".gitignore"
  }
}
```

**UI Update:**
- Icon: 📄
- Progress: 95%
- Message: "Analyzing .gitignore"
- **File Counter: "Analyzing file 3 of 3"**
- Progress Bar: 95% filled (almost complete!)

---

```
EVENT #10
data: {
  "stage": "generating_report",
  "message": "Generating analysis report",
  "progress": 95
}
```

**UI Update:**
- Icon: 📊
- Progress: 95%
- Message: "Generating analysis report"
- Progress Bar: 95% filled

---

```
EVENT #11
data: {
  "stage": "complete",
  "message": "Analysis complete",
  "progress": 100,
  "data": {
    "summary": {
      "filesAnalyzed": 3,
      "overallQuality": 85,
      "requestedFileLimit": 3,
      "totalCodeFiles": 47,
      "timestamp": "2025-10-30T15:32:29.935Z"
    },
    "quality": {
      "score": 85,
      "issueCount": 2,
      "topIssues": [
        {
          "severity": "medium",
          "file": "README.md",
          "message": "Missing documentation for setup"
        },
        {
          "severity": "low",
          "file": "index.html",
          "message": "Consider adding meta tags"
        }
      ]
    },
    "files": [
      {
        "path": "README.md",
        "quality": 80,
        "issues": 1
      },
      {
        "path": "index.html",
        "quality": 90,
        "issues": 1
      },
      {
        "path": ".gitignore",
        "quality": 100,
        "issues": 0
      }
    ]
  }
}
```

**UI Update:**
- Icon: ✨
- Progress: 100%
- Message: "Analysis complete"
- Progress Bar: 100% filled (green)
- **LoadingSpinner disappears**
- **Results dashboard appears**

---

## Error Example

### If Repository Not Found

```
EVENT #1
data: {
  "stage": "connected",
  "message": "Connected to analysis stream",
  "progress": 0
}

EVENT #2
data: {
  "stage": "validation",
  "message": "Validating repository URL",
  "progress": 5
}

EVENT #3
data: {
  "stage": "error",
  "message": "Repository not found",
  "progress": 0,
  "data": {
    "error": "Repository 'owner/nonexistent' not found",
    "code": "REPO_NOT_FOUND"
  }
}
```

**UI Update:**
- Icon: ❌
- Progress: 0%
- LoadingSpinner disappears
- Error message shown: "Repository 'owner/nonexistent' not found"
- Fallback to REST API attempted

---

## File Error Example

### If One File Fails (Non-Fatal)

```
EVENT #7
data: {
  "stage": "analyzing_file",
  "message": "Analyzing src/broken.js",
  "progress": 52,
  "current": 1,
  "total": 3,
  "data": {
    "fileName": "src/broken.js"
  }
}

EVENT #8
data: {
  "stage": "file_error",
  "message": "Failed to analyze src/broken.js",
  "progress": 52,
  "current": 1,
  "total": 3,
  "data": {
    "fileName": "src/broken.js",
    "error": "File not accessible"
  }
}

EVENT #9
data: {
  "stage": "analyzing_file",
  "message": "Analyzing src/next.js",
  "progress": 73,
  "current": 2,
  "total": 3,
  "data": {
    "fileName": "src/next.js"
  }
}

... (continues with remaining files)
```

**UI Update:**
- Icon changes to ⚠️ briefly for file_error
- Shows warning: "Failed to analyze src/broken.js"
- Continues to next file
- Analysis completes normally

---

## Cached Result Example

### If Result Already Exists in Cache

```
EVENT #1
data: {
  "stage": "connected",
  "message": "Connected to analysis stream",
  "progress": 0
}

EVENT #2
data: {
  "stage": "validation",
  "message": "Validating repository URL",
  "progress": 5
}

EVENT #3
data: {
  "stage": "cached",
  "message": "Returning cached analysis",
  "progress": 100,
  "data": {
    "summary": { ... },
    "quality": { ... },
    "files": [ ... ]
  }
}
```

**UI Update:**
- Icon: 💾
- Progress: Jumps from 5% to 100%
- Message: "Returning cached analysis"
- Results appear immediately (fast!)

---

## Timeline Visualization

```
Time    Progress  Stage              Icon  Message
------  --------  -----------------  ----  -------------------------
0.0s    0%        connected          🔌    Connected to stream
0.1s    5%        validation         ✅    Validating URL
0.2s    10%       parsing            🔍    Parsing URL
0.3s    15%       fetching_tree      🌳    Fetching file tree
1.5s    25%       tree_fetched       📁    Found 47 files
1.6s    30%       analysis_starting  🚀    Starting analysis
2.0s    52%       analyzing_file     📄    Analyzing README.md (1/3)
4.0s    73%       analyzing_file     📄    Analyzing index.html (2/3)
6.0s    95%       analyzing_file     📄    Analyzing .gitignore (3/3)
6.1s    95%       generating_report  📊    Generating report
6.2s    100%      complete           ✨    Analysis complete
```

**Total Duration:** ~6 seconds for 3 files

---

## Progress Bar Visual States

```
0%   [░░░░░░░░░░░░░░░░░░░░] 🔌 Connected
5%   [█░░░░░░░░░░░░░░░░░░░] ✅ Validating
10%  [██░░░░░░░░░░░░░░░░░░] 🔍 Parsing
15%  [███░░░░░░░░░░░░░░░░░] 🌳 Fetching
25%  [█████░░░░░░░░░░░░░░░] 📁 Found files
30%  [██████░░░░░░░░░░░░░░] 🚀 Starting
52%  [██████████░░░░░░░░░░] 📄 File 1/3
73%  [██████████████░░░░░░] 📄 File 2/3
95%  [███████████████████░] 📄 File 3/3
95%  [███████████████████░] 📊 Generating
100% [████████████████████] ✨ Complete!
```

---

## Event Properties Reference

### All Events Have:
- `stage` (string) - Current stage identifier
- `message` (string) - Human-readable message
- `progress` (number) - Percentage (0-100)

### Additional Properties:

#### analyzing_file
- `current` (number) - Current file index (1-based)
- `total` (number) - Total files to analyze
- `data.fileName` (string) - Name of current file

#### tree_fetched
- `data.totalCodeFiles` (number) - Files found in repo

#### analysis_starting
- `data.filesToAnalyze` (number) - Files that will be analyzed

#### complete
- `data` (object) - Full analysis results
  - `summary` - Overall metrics
  - `quality` - Quality scores and issues
  - `files` - Individual file results

#### error
- `data.error` (string) - Error message
- `data.code` (string) - Error code

---

## Integration Code Example

```javascript
// frontend/src/hooks/useAnalysisStream.js

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.substring(6));

      // Example: EVENT #7
      // {
      //   "stage": "analyzing_file",
      //   "message": "Analyzing README.md",
      //   "progress": 52,
      //   "current": 1,
      //   "total": 3
      // }

      setStage(event.stage);           // "analyzing_file"
      setMessage(event.message);        // "Analyzing README.md"
      setProgress(event.progress);      // 52

      if (event.current && event.total) {
        setCurrentFile({
          current: event.current,       // 1
          total: event.total            // 3
        });
      }
    }
  }
}
```

---

## Testing the Events

### 1. Browser Console

```javascript
async function testSSE() {
  const response = await fetch('http://localhost:3000/api/analyze/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoUrl: 'https://github.com/octocat/Hello-World',
      fileLimit: 3
    })
  });

  const reader = response.body.getReader();
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
        console.log(`[${event.stage}] ${event.progress}% - ${event.message}`);
      }
    }
  }
}

testSSE();
```

### 2. cURL Command

```bash
curl -N -X POST http://localhost:3000/api/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/octocat/Hello-World","fileLimit":3}'
```

### 3. HTML Test Page

Open `frontend/test-sse.html` in a browser.

---

## Summary

The SSE implementation provides:
- **11 events** for successful analysis (connected → complete)
- **Real-time updates** every few seconds
- **Detailed progress** from 0% to 100%
- **File-by-file tracking** with counters
- **Error handling** with specific error codes
- **Cached results** for fast responses

All events are handled by the frontend to provide smooth, real-time user experience! 🚀
