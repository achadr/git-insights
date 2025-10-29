const QualityScore = ({ score }) => {
  const getColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`rounded-lg border-2 p-6 text-center ${getBgColor(score)}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Overall Quality Score
      </h3>
      <div className={`text-6xl font-bold ${getColor(score)} mb-2`}>
        {score}
      </div>
      <div className="text-gray-600">
        out of 100
      </div>
    </div>
  );
};

export default QualityScore;
