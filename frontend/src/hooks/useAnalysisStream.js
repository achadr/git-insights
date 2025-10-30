import { useState, useCallback, useRef, useEffect } from 'react';

const baseURL = import.meta.env.VITE_API_URL;

export function useAnalysisStream() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle');
  const [message, setMessage] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const readerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startAnalysis = useCallback(async (repoUrl, apiKey = null, fileLimit = 10) => {
    if (!repoUrl) return;

    // Cleanup any previous connection
    cleanup();

    setIsAnalyzing(true);
    setProgress(0);
    setStage('connecting');
    setMessage('Connecting to analysis service...');
    setResult(null);
    setError(null);
    setCurrentFile(null);

    try {
      abortControllerRef.current = new AbortController();

      const headers = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-anthropic-api-key'] = apiKey;
      }

      const response = await fetch(`${baseURL}/analyze/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ repoUrl, fileLimit }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
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

            setStage(event.stage);
            setMessage(event.message);
            setProgress(event.progress || 0);

            if (event.current && event.total) {
              setCurrentFile({ current: event.current, total: event.total });
            }

            if (event.stage === 'complete' || event.stage === 'cached') {
              setResult(event.data);
              setIsAnalyzing(false);
              cleanup();
            } else if (event.stage === 'error') {
              setError(event.data);
              setIsAnalyzing(false);
              cleanup();
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Analysis was cancelled by user
        console.log('Analysis cancelled');
      } else {
        const errorData = {
          error: err.message,
          code: 'CLIENT_ERROR'
        };
        setError(errorData);
      }
      setIsAnalyzing(false);
      cleanup();
    }
  }, [cleanup]);

  const cancelAnalysis = useCallback(() => {
    cleanup();
    setIsAnalyzing(false);
    setStage('cancelled');
    setMessage('Analysis cancelled');
  }, [cleanup]);

  return {
    startAnalysis,
    cancelAnalysis,
    isAnalyzing,
    progress,
    stage,
    message,
    currentFile,
    result,
    error,
  };
}
