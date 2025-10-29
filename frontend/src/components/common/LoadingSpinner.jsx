import { useState, useEffect } from 'react';

const LoadingSpinner = ({ withSkeleton = true }) => {
  const [loadingText, setLoadingText] = useState('Analyzing repository');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const messages = [
      'Analyzing repository',
      'Fetching code files',
      'Running quality checks',
      'Evaluating security',
      'Generating insights',
    ];
    let messageIndex = 0;

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingText(messages[messageIndex]);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="space-y-6 py-8">
      {/* Spinner and Message */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-transparent border-b-blue-400 dark:border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {loadingText}{dots}
          </p>
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
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
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
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
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

export default LoadingSpinner;
