import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const CopyButton = ({ text, label = 'Copy', className = '' }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(text);
      }}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
        isCopied
          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
      title={isCopied ? 'Copied!' : `Copy ${label}`}
    >
      {isCopied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

export default CopyButton;
