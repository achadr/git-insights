import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
  withSkeleton = true,
  progress = 0,
  message = '',
  currentFile = null,
  stage = ''
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(dotsInterval);
    };
  }, []);

  // Get stage-specific colors and icons
  const getStageColor = (stage) => {
    const colors = {
      'connected': 'text-green-600 dark:text-green-400',
      'validation': 'text-blue-600 dark:text-blue-400',
      'parsing': 'text-yellow-600 dark:text-yellow-400',
      'fetching_tree': 'text-purple-600 dark:text-purple-400',
      'tree_fetched': 'text-cyan-600 dark:text-cyan-400',
      'analysis_starting': 'text-indigo-600 dark:text-indigo-400',
      'analyzing_file': 'text-orange-600 dark:text-orange-400',
      'file_error': 'text-amber-600 dark:text-amber-400',
      'generating_report': 'text-brown-600 dark:text-brown-400',
      'complete': 'text-green-600 dark:text-green-400',
      'cached': 'text-gray-600 dark:text-gray-400',
    };
    return colors[stage] || 'text-blue-600 dark:text-blue-400';
  };

  const getStageIcon = (stage) => {
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
      'cached': '💾',
    };
    return icons[stage] || '⏳';
  };

  const displayMessage = message || 'Starting analysis...';

  return (
    <div className="space-y-6 py-8" aria-live="polite" aria-busy="true">
      {/* Spinner and Message */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-transparent border-b-blue-400 dark:border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
        </div>

        {/* Progress Information */}
        <div className="mt-6 text-center space-y-3">
          {/* Stage Icon and Progress Percentage */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{getStageIcon(stage)}</span>
            <span className={`text-2xl font-bold ${getStageColor(stage)}`}>
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-80 max-w-full mx-auto">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Status Message */}
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {displayMessage}{dots}
          </p>

          {/* File Counter */}
          {currentFile && (
            <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
              Analyzing file {currentFile.current} of {currentFile.total}
            </p>
          )}

          {/* General Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>

      {/* Skeleton Screens */}
      {withSkeleton && (
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          {/* Quality Score Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="flex items-center justify-center h-24">
                <div className="h-20 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {['quality-1', 'quality-2', 'quality-3'].map(id => (
                  <div key={id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-500 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Files List Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {['file-1', 'file-2', 'file-3'].map(id => (
                <div key={id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                    </div>
                    <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  withSkeleton: PropTypes.bool,
  progress: PropTypes.number,
  message: PropTypes.string,
  currentFile: PropTypes.shape({
    current: PropTypes.number,
    total: PropTypes.number,
  }),
  stage: PropTypes.string,
};

export default LoadingSpinner;
