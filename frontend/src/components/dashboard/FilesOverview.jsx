const FilesOverview = ({ files }) => {
  if (!files || files.length === 0) {
    return null;
  }

  // Categorize files by score
  const excellent = files.filter(f => f.score >= 80).length;
  const good = files.filter(f => f.score >= 60 && f.score < 80).length;
  const fair = files.filter(f => f.score >= 40 && f.score < 60).length;
  const poor = files.filter(f => f.score < 40).length;

  const categories = [
    { label: 'Excellent', count: excellent, color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    { label: 'Good', count: good, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
    { label: 'Fair', count: fair, color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    { label: 'Poor', count: poor, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  ];

  const total = files.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        File Quality Distribution
      </h3>

      {/* Visual Bar Chart */}
      <div className="mb-4">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {categories.map((cat, idx) => {
            const percentage = (cat.count / total) * 100;
            if (percentage === 0) return null;
            return (
              <div
                key={idx}
                className={`${cat.color} flex items-center justify-center text-white text-xs font-semibold`}
                style={{ width: `${percentage}%` }}
                title={`${cat.label}: ${cat.count} files`}
              >
                {percentage >= 10 && cat.count}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat, idx) => (
          <div key={idx} className={`${cat.bgColor} rounded-lg p-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${cat.color} mr-2`}></div>
                <span className={`text-xs font-medium ${cat.textColor}`}>{cat.label}</span>
              </div>
              <span className={`text-lg font-bold ${cat.textColor}`}>{cat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
        <span>Total Files: {total}</span>
        <span>
          Average Score: {Math.round(files.reduce((sum, f) => sum + f.score, 0) / total)}
        </span>
      </div>
    </div>
  );
};

export default FilesOverview;
