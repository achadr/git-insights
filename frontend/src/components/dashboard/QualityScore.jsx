const QualityScore = ({ score }) => {
  const getColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    if (score >= 60) return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
    if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Calculate percentage for circular progress
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-lg border-2 p-6 text-center transition-all duration-200 transform hover:scale-105 ${getBgColor(score)}`}>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Overall Quality Score
      </h3>

      {/* Circular Progress */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <svg className="transform -rotate-90 w-40 h-40">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${getColor(score)} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute">
          <div className={`text-5xl font-bold ${getColor(score)}`}>
            {score}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className={`text-xl font-semibold ${getColor(score)}`}>
          {getLabel(score)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          out of 100
        </div>
      </div>
    </div>
  );
};

export default QualityScore;
