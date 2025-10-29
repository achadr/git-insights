import { useState, useRef, useMemo, useCallback } from 'react';
import RepoUrlInput from '../components/forms/RepoUrlInput';
import AnalysisDashboard from '../components/dashboard/AnalysisDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import KeyboardShortcutsModal from '../components/common/KeyboardShortcutsModal';
import { analyzeRepository } from '../services/api';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../contexts/ThemeContext';
import { enhanceAnalysisData } from '../utils/dataEnhancement';

const HomePage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef(null);
  const { toggleTheme } = useTheme();

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

  const handleAnalyze = useCallback(async (url, fileLimit) => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    setRepoUrl(url);

    try {
      const result = await analyzeRepository(url, null, fileLimit);
      const enhancedData = enhanceAnalysisData(result.data);
      setAnalysis(enhancedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

      {loading && <LoadingSpinner />}

      {error && (
        <div className="mt-8 animate-slide-in">
          <ErrorMessage message={error} />
        </div>
      )}

      {analysis && (
        <div className="mt-8 animate-fade-in">
          <AnalysisDashboard data={analysis} repoUrl={repoUrl} />
        </div>
      )}

      {!loading && !error && !analysis && (
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
