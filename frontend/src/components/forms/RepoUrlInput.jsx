import { useState } from 'react';
import PropTypes from 'prop-types';
import { FILE_LIMITS } from '../../constants/scoreThresholds';

const RepoUrlInput = ({ onSubmit }) => {
  const [url, setUrl] = useState('');
  const [fileLimit, setFileLimit] = useState(10);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url) => {
    if (!url) {
      return 'Repository URL is required';
    }
    // Improved regex to validate GitHub repository URLs
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubUrlPattern.test(url.trim())) {
      return 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)';
    }
    return '';
  };

  const validateFileLimit = (limit) => {
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 1 || num > FILE_LIMITS.MAX_FILES) {
      return `File limit must be between 1 and ${FILE_LIMITS.MAX_FILES}`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    const fileLimitError = validateFileLimit(fileLimit);
    if (fileLimitError) {
      setError(fileLimitError);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(url, fileLimit);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Repository URL
        </label>
        <input
          type="text"
          id="repoUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 transition-colors duration-200"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="fileLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Number of files to analyze (1-{FILE_LIMITS.MAX_FILES})
        </label>
        <input
          type="number"
          id="fileLimit"
          value={fileLimit}
          onChange={(e) => setFileLimit(e.target.value)}
          min="1"
          max={FILE_LIMITS.MAX_FILES}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Smart selection prioritizes entry points and important files
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 animate-slide-in">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 px-6 rounded-md transition-all duration-200 font-medium disabled:bg-blue-400 dark:disabled:bg-blue-700 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
};

RepoUrlInput.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default RepoUrlInput;
