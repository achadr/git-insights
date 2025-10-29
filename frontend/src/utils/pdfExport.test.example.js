/**
 * Example test data for PDF generation
 * This can be used for manual testing in the browser
 */

export const mockAnalysisData = {
  summary: {
    filesAnalyzed: 12,
    overallQuality: 78,
    timestamp: new Date().toISOString(),
  },
  quality: {
    score: 78,
    issueCount: 25,
    topIssues: [
      'Complex nested logic in authentication flow',
      'Missing error handling in API calls',
      'Unused variables and imports detected',
      'Performance bottleneck in data processing',
      'Inconsistent naming conventions',
      'Missing input validation',
      'Potential memory leak in event listeners',
      'Code duplication in utility functions',
    ],
  },
  files: [
    {
      file: 'src/components/dashboard/AnalysisDashboard.jsx',
      score: 85,
      issues: [
        'Component complexity could be reduced by extracting sub-components',
        'Consider memoizing expensive calculations',
      ],
      recommendations: [
        'Extract FilesList into a separate component',
        'Use React.memo for performance optimization',
        'Add PropTypes or TypeScript for type safety',
      ],
    },
    {
      file: 'src/services/api.js',
      score: 72,
      issues: [
        'Missing error handling for network failures',
        'API timeout not configured',
        'No retry logic for failed requests',
        'Hardcoded API endpoints',
      ],
      recommendations: [
        'Implement exponential backoff for retries',
        'Add environment-based configuration',
        'Use axios interceptors for error handling',
      ],
    },
    {
      file: 'src/utils/helpers.js',
      score: 90,
      issues: [
        'Minor: Some functions could have better documentation',
      ],
      recommendations: [
        'Add JSDoc comments for public functions',
      ],
    },
    {
      file: 'src/components/forms/RepoUrlInput.jsx',
      score: 68,
      issues: [
        'URL validation is too permissive',
        'No sanitization of user input',
        'Missing accessibility attributes',
      ],
      recommendations: [
        'Implement strict GitHub URL validation',
        'Add ARIA labels for screen readers',
        'Add input sanitization before processing',
      ],
    },
    {
      file: 'src/hooks/useAnalysis.js',
      score: 82,
      issues: [
        'Race condition possible with rapid state updates',
        'No cleanup for cancelled requests',
      ],
      recommendations: [
        'Implement AbortController for request cancellation',
        'Add debouncing for rapid calls',
      ],
    },
    {
      file: 'src/App.jsx',
      score: 88,
      issues: [],
      recommendations: [
        'Consider code-splitting for better performance',
      ],
    },
    {
      file: 'src/components/common/LoadingSpinner.jsx',
      score: 95,
      issues: [],
      recommendations: [
        'Add customizable size variants',
      ],
    },
    {
      file: 'src/components/common/ErrorMessage.jsx',
      score: 92,
      issues: [],
      recommendations: [
        'Add support for different error severity levels',
      ],
    },
    {
      file: 'src/pages/HomePage.jsx',
      score: 75,
      issues: [
        'State management could be improved',
        'Large component file - consider splitting',
      ],
      recommendations: [
        'Extract business logic to custom hooks',
        'Split into smaller sub-components',
      ],
    },
    {
      file: 'src/components/dashboard/QualityScore.jsx',
      score: 55,
      issues: [
        'High complexity in score calculation',
        'Multiple nested conditional statements',
        'Performance issues with frequent re-renders',
        'Missing error boundaries',
      ],
      recommendations: [
        'Simplify conditional logic',
        'Add error boundaries',
        'Optimize rendering with useMemo',
      ],
    },
    {
      file: 'src/components/dashboard/FileCard.jsx',
      score: 38,
      issues: [
        'Critical: Memory leak from uncleaned event listeners',
        'Poor performance due to inline function definitions',
        'Missing PropTypes validation',
        'Accessibility issues - no keyboard navigation',
        'No error handling for edge cases',
      ],
      recommendations: [
        'Add cleanup in useEffect',
        'Move functions outside render',
        'Implement keyboard navigation',
        'Add comprehensive error handling',
      ],
    },
    {
      file: 'src/styles/main.css',
      score: 80,
      issues: [
        'Some unused CSS rules',
        'Could benefit from CSS modules',
      ],
      recommendations: [
        'Remove unused styles',
        'Consider CSS-in-JS or modules',
      ],
    },
  ],
};

export const mockRepoUrl = 'https://github.com/example/git-insights';

/**
 * To test PDF generation in the browser console:
 *
 * import { generatePDFReport } from './utils/pdfExport';
 * import { mockAnalysisData, mockRepoUrl } from './utils/pdfExport.test.example';
 *
 * generatePDFReport(mockAnalysisData, mockRepoUrl)
 *   .then(() => console.log('PDF generated successfully'))
 *   .catch(err => console.error('PDF generation failed:', err));
 */
