import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import QualityScore from './QualityScore';
import ExpandableFilesList from './ExpandableFilesList';
import FilesOverview from './FilesOverview';
import ExportDataButton from '../common/ExportDataButton';

// Lazy load PDF export to reduce main bundle size (html2canvas is ~200KB)
const ExportPDFButton = lazy(() => import('../common/ExportPDFButton'));

const AnalysisDashboard = ({ data, repoUrl }) => {
  // Calculate total issues across all files
  const totalIssues = data.files?.reduce((sum, file) => sum + (file.issues?.length || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title and Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive code quality analysis and insights
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportDataButton analysisData={data} repoUrl={repoUrl} />
          <Suspense fallback={
            <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gray-300 text-gray-500 cursor-not-allowed">
              <span>Loading...</span>
            </button>
          }>
            <ExportPDFButton analysisData={data} repoUrl={repoUrl} />
          </Suspense>
        </div>
      </div>

      {/* Top Section: Quality Score and Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Quality Score */}
        <div className="lg:col-span-1">
          <QualityScore score={data.summary.overallQuality} />
        </div>

        {/* Summary Statistics */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Analysis Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Files</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.summary.filesAnalyzed}</p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Issues</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalIssues}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Score</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.summary.overallQuality}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analyzed on {new Date(data.summary.timestamp).toLocaleString()}
              </p>
              {data.metadata && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Analyzed {data.summary.filesAnalyzed} of {data.metadata.totalCodeFiles} code files
                  </p>
                  {data.metadata.totalCodeFiles > data.summary.filesAnalyzed && (
                    <p className="text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Increase file limit to analyze more files
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: File Quality Distribution */}
      <FilesOverview files={data.files} />

      {/* Bottom Section: Expandable File List (Full Width) */}
      <div>
        <ExpandableFilesList files={data.files} />
      </div>
    </div>
  );
};

AnalysisDashboard.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.shape({
      overallQuality: PropTypes.number.isRequired,
      filesAnalyzed: PropTypes.number.isRequired,
      timestamp: PropTypes.string.isRequired,
    }).isRequired,
    files: PropTypes.array.isRequired,
    metadata: PropTypes.shape({
      totalCodeFiles: PropTypes.number,
    }),
  }).isRequired,
  repoUrl: PropTypes.string.isRequired,
};

export default AnalysisDashboard;
