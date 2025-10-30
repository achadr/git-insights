import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import RepoUrlInput from '../components/forms/RepoUrlInput';
import AnalysisDashboard from '../components/dashboard/AnalysisDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import KeyboardShortcutsModal from '../components/common/KeyboardShortcutsModal';
import { analyzeRepository } from '../services/api';
import { useAnalysisStream } from '../hooks/useAnalysisStream';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../contexts/ThemeContext';
import { enhanceAnalysisData } from '../utils/dataEnhancement';

const HomePage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fallbackError, setFallbackError] = useState('');
  const searchInputRef = useRef(null);
  const { toggleTheme } = useTheme();

  // SSE hook for real-time progress
  const {
    startAnalysis,
    cancelAnalysis,
    isAnalyzing,
    progress,
    stage,
    message,
    currentFile,
    result: sseResult,
    error: sseError,
  } = useAnalysisStream();

  // Memoize keyboard shortcuts to prevent recreation on every render
  const keyboardShortcuts = useMemo(() => ({
    '?': () => setShowShortcuts(true),
    'ctrl+d': () => toggleTheme(),
    'ctrl+k': () => {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) searchInput.focus();
    },
    'escape': () => {
      setShowShortcuts(false);
      document.activeElement?.blur();
    },
    'ctrl+p': () => {
      if (analysis) window.print();
    },
  }), [toggleTheme, analysis]);

  // Keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts);

  // Handle SSE result
  useEffect(() => {
    if (sseResult) {
      const enhancedData = enhanceAnalysisData(sseResult);
      setAnalysis(enhancedData);
    }
  }, [sseResult]);

  // Fallback to REST API if SSE fails
  const fallbackToREST = useCallback(async (url, fileLimit) => {
    console.log('Falling back to REST API...');
    setFallbackError('');

    try {
      const result = await analyzeRepository(url, null, fileLimit);
      const enhancedData = enhanceAnalysisData(result.data);
      setAnalysis(enhancedData);
    } catch (err) {
      setFallbackError(err.message);
    }
  }, []);

  // Handle SSE error with fallback
  useEffect(() => {
    if (sseError && repoUrl) {
      console.error('SSE Error:', sseError);
      // Try REST API as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const fileLimit = parseInt(urlParams.get('fileLimit')) || 10;
      fallbackToREST(repoUrl, fileLimit);
    }
  }, [sseError, repoUrl, fallbackToREST]);

  const handleAnalyze = useCallback(async (url, fileLimit) => {
    setAnalysis(null);
    setRepoUrl(url);
    setFallbackError('');

    // Start SSE stream for real-time progress
    await startAnalysis(url, null, fileLimit);
  }, [startAnalysis]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Analyze Your GitHub Repository
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Get AI-powered insights about code quality, security, and performance
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8 transition-colors duration-200">
        <RepoUrlInput onSubmit={handleAnalyze} />
      </div>

      {isAnalyzing && (
        <LoadingSpinner
          progress={progress}
          message={message}
          currentFile={currentFile}
          stage={stage}
        />
      )}

      {(sseError || fallbackError) && (
        <div className="mt-8 animate-slide-in">
          <ErrorMessage message={sseError?.error || fallbackError} />
          {sseError && (
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Attempted fallback to REST API
            </div>
          )}
        </div>
      )}

      {analysis && (
        <div className="mt-8 animate-fade-in">
          <AnalysisDashboard data={analysis} repoUrl={repoUrl} />
        </div>
      )}

      {!isAnalyzing && !sseError && !fallbackError && !analysis && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-4">
            Enter a GitHub repository URL above to get started
          </div>
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            View keyboard shortcuts
          </button>
        </div>
      )}

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default HomePage;
