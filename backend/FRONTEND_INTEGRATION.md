# Frontend Integration Guide for SSE

This guide helps frontend developers integrate the new Server-Sent Events (SSE) endpoint for real-time progress tracking.

## Quick Start

### Basic Fetch Implementation

```javascript
async function analyzeRepository(repoUrl, fileLimit = 10) {
  const response = await fetch('http://localhost:3000/api/analyze/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repoUrl, fileLimit })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

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
        const event = JSON.parse(line.substring(6));
        handleProgressEvent(event);
      }
    }
  }
}

function handleProgressEvent(event) {
  console.log(`[${event.stage}] ${event.message} - ${event.progress}%`);

  switch (event.stage) {
    case 'connected':
      console.log('Connected to server');
      break;
    case 'analyzing_file':
      console.log(`Analyzing file ${event.current}/${event.total}: ${event.data.fileName}`);
      break;
    case 'complete':
      console.log('Analysis complete!', event.data);
      break;
    case 'error':
      console.error('Error:', event.data.error);
      break;
  }
}
```

## React Integration

### Custom Hook

```typescript
// useAnalysisStream.ts
import { useState, useEffect, useCallback } from 'react';

interface ProgressEvent {
  stage: string;
  message: string;
  progress: number;
  current?: number;
  total?: number;
  data?: any;
}

interface UseAnalysisStreamOptions {
  repoUrl: string;
  fileLimit?: number;
  apiKey?: string;
  onProgress?: (event: ProgressEvent) => void;
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useAnalysisStream({
  repoUrl,
  fileLimit = 10,
  apiKey,
  onProgress,
  onComplete,
  onError
}: UseAnalysisStreamOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle');
  const [message, setMessage] = useState('');
  const [currentFile, setCurrentFile] = useState<{current: number, total: number} | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const startAnalysis = useCallback(async () => {
    if (!repoUrl) return;

    setIsAnalyzing(true);
    setProgress(0);
    setStage('connecting');
    setMessage('Connecting...');
    setResult(null);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-anthropic-api-key'] = apiKey;
      }

      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ repoUrl, fileLimit })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event: ProgressEvent = JSON.parse(line.substring(6));

            setStage(event.stage);
            setMessage(event.message);
            setProgress(event.progress || 0);

            if (event.current && event.total) {
              setCurrentFile({ current: event.current, total: event.total });
            }

            onProgress?.(event);

            if (event.stage === 'complete') {
              setResult(event.data);
              setIsAnalyzing(false);
              onComplete?.(event.data);
            } else if (event.stage === 'error') {
              setError(event.data);
              setIsAnalyzing(false);
              onError?.(event.data);
            }
          }
        }
      }
    } catch (err: any) {
      const errorData = { error: err.message, code: 'CLIENT_ERROR' };
      setError(errorData);
      setIsAnalyzing(false);
      onError?.(errorData);
    }
  }, [repoUrl, fileLimit, apiKey, onProgress, onComplete, onError]);

  return {
    startAnalysis,
    isAnalyzing,
    progress,
    stage,
    message,
    currentFile,
    result,
    error
  };
}
```

### Component Example

```tsx
// AnalysisProgress.tsx
import React from 'react';
import { useAnalysisStream } from './useAnalysisStream';

interface AnalysisProgressProps {
  repoUrl: string;
  fileLimit?: number;
  apiKey?: string;
}

export function AnalysisProgress({ repoUrl, fileLimit = 10, apiKey }: AnalysisProgressProps) {
  const {
    startAnalysis,
    isAnalyzing,
    progress,
    stage,
    message,
    currentFile,
    result,
    error
  } = useAnalysisStream({
    repoUrl,
    fileLimit,
    apiKey,
    onProgress: (event) => {
      console.log('Progress:', event);
    },
    onComplete: (data) => {
      console.log('Analysis complete!', data);
    },
    onError: (err) => {
      console.error('Analysis failed:', err);
    }
  });

  return (
    <div className="analysis-progress">
      <button
        onClick={startAnalysis}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>

      {isAnalyzing && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
          <p className="progress-message">{message}</p>
          {currentFile && (
            <p className="file-progress">
              File {currentFile.current} of {currentFile.total}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="error">
          <h3>Error</h3>
          <p>{error.error}</p>
        </div>
      )}

      {result && (
        <div className="results">
          <h3>Analysis Complete!</h3>
          <p>Quality Score: {result.summary.overallQuality}/100</p>
          <p>Files Analyzed: {result.summary.filesAnalyzed}</p>
          <p>Issues Found: {result.quality.issueCount}</p>
        </div>
      )}
    </div>
  );
}
```

## Vue 3 Integration

```vue
<template>
  <div class="analysis-progress">
    <button @click="startAnalysis" :disabled="isAnalyzing">
      {{ isAnalyzing ? 'Analyzing...' : 'Start Analysis' }}
    </button>

    <div v-if="isAnalyzing" class="progress-container">
      <div class="progress-bar" :style="{ width: `${progress}%` }">
        {{ progress }}%
      </div>
      <p class="progress-message">{{ message }}</p>
      <p v-if="currentFile" class="file-progress">
        File {{ currentFile.current }} of {{ currentFile.total }}
      </p>
    </div>

    <div v-if="error" class="error">
      <h3>Error</h3>
      <p>{{ error.error }}</p>
    </div>

    <div v-if="result" class="results">
      <h3>Analysis Complete!</h3>
      <p>Quality Score: {{ result.summary.overallQuality }}/100</p>
      <p>Files Analyzed: {{ result.summary.filesAnalyzed }}</p>
      <p>Issues Found: {{ result.quality.issueCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  repoUrl: string;
  fileLimit?: number;
  apiKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fileLimit: 10,
});

const isAnalyzing = ref(false);
const progress = ref(0);
const stage = ref('idle');
const message = ref('');
const currentFile = ref<{current: number, total: number} | null>(null);
const result = ref<any>(null);
const error = ref<any>(null);

async function startAnalysis() {
  isAnalyzing.value = true;
  progress.value = 0;
  stage.value = 'connecting';
  message.value = 'Connecting...';
  result.value = null;
  error.value = null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (props.apiKey) {
      headers['x-anthropic-api-key'] = props.apiKey;
    }

    const response = await fetch('/api/analyze/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        repoUrl: props.repoUrl,
        fileLimit: props.fileLimit
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.substring(6));

          stage.value = event.stage;
          message.value = event.message;
          progress.value = event.progress || 0;

          if (event.current && event.total) {
            currentFile.value = { current: event.current, total: event.total };
          }

          if (event.stage === 'complete') {
            result.value = event.data;
            isAnalyzing.value = false;
          } else if (event.stage === 'error') {
            error.value = event.data;
            isAnalyzing.value = false;
          }
        }
      }
    }
  } catch (err: any) {
    error.value = { error: err.message, code: 'CLIENT_ERROR' };
    isAnalyzing.value = false;
  }
}
</script>
```

## Stage-Based UI Updates

You can customize UI based on different stages:

```javascript
function getStageIcon(stage) {
  const icons = {
    'connected': '🔌',
    'validation': '✅',
    'parsing': '🔍',
    'fetching_tree': '🌳',
    'tree_fetched': '📁',
    'analysis_starting': '🚀',
    'analyzing_file': '📄',
    'file_error': '⚠️',
    'generating_report': '📊',
    'complete': '✨',
    'error': '❌',
    'cached': '💾'
  };
  return icons[stage] || '⏳';
}

function getStageColor(stage) {
  const colors = {
    'connected': '#4CAF50',
    'validation': '#2196F3',
    'parsing': '#FF9800',
    'fetching_tree': '#9C27B0',
    'tree_fetched': '#00BCD4',
    'analysis_starting': '#3F51B5',
    'analyzing_file': '#FF5722',
    'file_error': '#FFC107',
    'generating_report': '#795548',
    'complete': '#4CAF50',
    'error': '#F44336',
    'cached': '#607D8B'
  };
  return colors[stage] || '#9E9E9E';
}
```

## Error Handling

```javascript
function handleAnalysisError(error) {
  // Network errors
  if (error.code === 'CLIENT_ERROR') {
    return 'Network error. Please check your connection.';
  }

  // Rate limiting
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return 'Rate limit exceeded. Please try again later or provide your API key.';
  }

  // Repository not found
  if (error.code === 'REPO_NOT_FOUND') {
    return 'Repository not found. Please check the URL.';
  }

  // Invalid API key
  if (error.code === 'INVALID_API_KEY') {
    return 'Invalid API key. Please check your Anthropic API key.';
  }

  // Generic error
  return error.error || 'An unexpected error occurred.';
}
```

## Testing

### Manual Testing

```javascript
// Test in browser console
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
        console.log(event);
      }
    }
  }
}

testSSE();
```

## API Key Usage

To bypass rate limits, provide your Anthropic API key:

```javascript
const response = await fetch('/api/analyze/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-anthropic-api-key': 'sk-ant-...'  // Your API key
  },
  body: JSON.stringify({ repoUrl, fileLimit })
});
```

## Comparison: REST vs SSE

### Use REST endpoint (`/api/analyze`) when:
- You don't need real-time progress updates
- You want simpler client code
- You're caching results aggressively
- You have connectivity issues

### Use SSE endpoint (`/api/analyze/stream`) when:
- You want to show real-time progress to users
- Analysis takes a long time (multiple files)
- You want better user experience
- You need to show which file is being analyzed

## Browser Compatibility

The Fetch API with streaming is supported in:
- Chrome 43+
- Firefox 39+
- Safari 10.1+
- Edge 14+

For older browsers, consider using a polyfill or the fallback REST endpoint.

## Performance Tips

1. **Debounce Progress Updates**: Update UI at most every 100ms
2. **Use Virtual Scrolling**: For long file lists
3. **Cache Results**: Store completed analysis in localStorage
4. **Cancel Analysis**: Close the connection if user navigates away

```javascript
// Debounced progress update
let lastUpdate = 0;
const updateInterval = 100; // ms

function handleProgressEvent(event) {
  const now = Date.now();
  if (now - lastUpdate < updateInterval && event.stage !== 'complete') {
    return;
  }
  lastUpdate = now;
  updateUI(event);
}
```

## Troubleshooting

### Events not received
- Check CORS settings
- Verify Content-Type header
- Check for proxy/firewall issues

### Connection drops
- Implement reconnection logic
- Add heartbeat monitoring
- Use connection timeout detection

### High memory usage
- Don't buffer all events
- Clear old progress data
- Limit DOM updates

## Next Steps

1. Implement the SSE client in your frontend
2. Test with various repository sizes
3. Add error handling and retry logic
4. Implement UI/UX improvements
5. Monitor performance and optimize
