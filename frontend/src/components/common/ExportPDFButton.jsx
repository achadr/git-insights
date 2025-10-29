import { useState } from 'react';
import PropTypes from 'prop-types';
import { generatePDFReport } from '../../utils/pdfExport';

/**
 * Button component for exporting analysis report as PDF
 */
const ExportPDFButton = ({ analysisData, repoUrl, className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Generate the PDF
      const result = await generatePDFReport(analysisData, repoUrl);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to generate PDF. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`
          flex items-center gap-2 px-4 py-2
          rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
          }
        `}
      >
        {isGenerating ? (
          <>
            {/* Loading Spinner */}
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            {/* Download Icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download PDF Report</span>
          </>
        )}
      </button>

      {/* Success Message */}
      {showSuccess && (
        <div
          className="absolute top-full mt-2 right-0 z-10
          bg-green-50 border border-green-200 rounded-lg px-4 py-2
          flex items-center gap-2 shadow-lg animate-fade-in"
        >
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium text-green-800">
            PDF downloaded successfully!
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="absolute top-full mt-2 right-0 z-10
          bg-red-50 border border-red-200 rounded-lg px-4 py-2
          flex items-center gap-2 shadow-lg animate-fade-in"
        >
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-sm font-medium text-red-800">{error}</span>
        </div>
      )}
    </div>
  );
};

ExportPDFButton.propTypes = {
  analysisData: PropTypes.object.isRequired,
  repoUrl: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default ExportPDFButton;
