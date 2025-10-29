const FilesList = ({ files }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Analyzed Files ({files.length})
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
          >
            <div className="flex items-center flex-1 min-w-0">
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-700 truncate" title={file.file}>
                {file.file}
              </span>
            </div>
            <span className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${getScoreColor(file.score)}`}>
              {file.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilesList;
