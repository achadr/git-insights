import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import CopyButton from '../common/CopyButton';
import Tooltip from '../common/Tooltip';
import { getScoreColorClasses, getScoreBadgeColor, getScoreLabel } from '../../utils/scoreUtils';

const FileCard = ({ file }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIssueIcon = (issue) => {
    // Handle both string format and object format {file, issue}
    const issueText = typeof issue === 'string' ? issue : issue.issue;
    const lowerIssue = issueText.toLowerCase();

    if (lowerIssue.includes('security') || lowerIssue.includes('vulnerability')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }

    if (lowerIssue.includes('performance') || lowerIssue.includes('slow')) {
      return (
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }

    if (lowerIssue.includes('complexity') || lowerIssue.includes('complex')) {
      return (
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }

    if (lowerIssue.includes('style') || lowerIssue.includes('format')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const hasIssues = file.issues && file.issues.length > 0;
  const hasRecommendations = file.recommendations && file.recommendations.length > 0;

  return (
    <div className={`rounded-lg border-2 transition-all duration-200 ${getScoreColorClasses(file.score)} ${isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 rounded-lg"
      >
        <div className="flex items-center flex-1 min-w-0 mr-4">
          <div className="flex-shrink-0 mr-3">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Tooltip content="Click to expand details" position="top">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.file}>
                  {file.file}
                </p>
              </Tooltip>
              <CopyButton text={file.file} label="file path" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getScoreLabel(file.score)} &bull; {file.issues?.length || 0} {file.issues?.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Tooltip content={`Quality Score: ${file.score}/100`} position="left">
            <div className={`px-4 py-2 rounded-full text-white font-bold ${getScoreBadgeColor(file.score)}`}>
              {file.score}
            </div>
          </Tooltip>
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
          {/* Issues Section */}
          {hasIssues && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Issues Found ({file.issues.length})
              </h4>
              <div className="space-y-2">
                {file.issues.map((issue, idx) => {
                  const issueText = typeof issue === 'string' ? issue : issue.issue;
                  const issueFile = typeof issue === 'string' ? null : issue.file;
                  const issueKey = typeof issue === 'string' ? `${file.file}-issue-${idx}` : `${issueFile || file.file}-${issueText.substring(0, 30)}`;

                  return (
                    <div key={issueKey} className="flex items-start bg-white bg-opacity-50 rounded p-3">
                      <div className="flex-shrink-0 mr-3 mt-0.5">
                        {getIssueIcon(issue)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{issueText}</p>
                        {issueFile && (
                          <p className="text-xs text-gray-500 mt-1">File: {issueFile}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {hasRecommendations && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommendations ({file.recommendations.length})
              </h4>
              <div className="space-y-2">
                {file.recommendations.map((rec, idx) => (
                  <div key={`${file.file}-rec-${rec.substring(0, 30)}-${idx}`} className="flex items-start bg-white bg-opacity-50 rounded p-3">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasIssues && !hasRecommendations && (
            <div className="text-center py-6 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No issues found in this file</p>
              <p className="text-xs mt-1">Great job!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

FileCard.propTypes = {
  file: PropTypes.shape({
    file: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    issues: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          issue: PropTypes.string,
          file: PropTypes.string,
        })
      ])
    ),
    recommendations: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default memo(FileCard);
