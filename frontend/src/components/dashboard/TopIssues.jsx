const TopIssues = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top Issues
        </h3>
        <p className="text-gray-500 text-center py-4">
          No issues found
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Top Issues ({issues.length})
      </h3>
      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopIssues;
