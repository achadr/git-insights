import { useState } from 'react';

const RepoUrlInput = ({ onSubmit }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url) => {
    if (!url) {
      return 'Repository URL is required';
    }
    if (!url.match(/github\.com/)) {
      return 'Please enter a valid GitHub repository URL';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Repository URL
        </label>
        <input
          type="text"
          id="repoUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
};

export default RepoUrlInput;
