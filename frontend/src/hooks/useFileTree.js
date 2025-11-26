import { useState, useCallback } from 'react';

const baseURL = import.meta.env.VITE_API_URL;

export function useFileTree() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalFiles, setTotalFiles] = useState(0);

  const fetchFiles = useCallback(async (repoUrl, apiKey = null) => {
    if (!repoUrl) return;

    setIsLoading(true);
    setError(null);
    setFiles([]);
    setTotalFiles(0);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-anthropic-api-key'] = apiKey;
      }

      const response = await fetch(`${baseURL}/files`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.data.files);
      setTotalFiles(data.data.totalFiles);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  return {
    files,
    totalFiles,
    isLoading,
    error,
    fetchFiles,
  };
}
