import { useState, useMemo } from 'react';
import FileCard from './FileCard';

const ExpandableFilesList = ({ files }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score-asc'); // score-asc, score-desc, name-asc, name-desc

  if (!files || files.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-lg">No files analyzed yet</p>
      </div>
    );
  }

  // Filter and sort files
  const processedFiles = useMemo(() => {
    let result = [...files];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(file =>
        file.file.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-asc':
          return a.score - b.score;
        case 'score-desc':
          return b.score - a.score;
        case 'name-asc':
          return a.file.localeCompare(b.file);
        case 'name-desc':
          return b.file.localeCompare(a.file);
        default:
          return a.score - b.score;
      }
    });

    return result;
  }, [files, searchTerm, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header with Search and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-xl font-semibold text-gray-800">
            File Analysis ({processedFiles.length} {processedFiles.length === 1 ? 'file' : 'files'})
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="score-asc">Score: Low to High</option>
              <option value="score-desc">Score: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            {processedFiles.length === 0 ? (
              <span className="text-red-600">No files match your search</span>
            ) : (
              <span>
                Showing {processedFiles.length} of {files.length} files
              </span>
            )}
          </div>
        )}
      </div>

      {/* File Cards */}
      {processedFiles.length > 0 ? (
        <div className="space-y-3">
          {processedFiles.map((file, index) => (
            <FileCard key={index} file={file} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No files match your search criteria</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-center text-sm text-gray-500 pt-2">
        Click on any file to expand and view detailed issues and recommendations
      </div>
    </div>
  );
};

export default ExpandableFilesList;
