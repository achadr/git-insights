import { memo } from 'react';
import PropTypes from 'prop-types';
import { getScoreColor, getScoreBgColor, getScoreLabel, getCircularProgressOffset } from '../../utils/scoreUtils';

const QualityScore = ({ score }) => {
  // Calculate percentage for circular progress
  const circumference = 2 * Math.PI * 70;
  const offset = getCircularProgressOffset(score, 70);

  return (
    <div className={`rounded-lg border-2 p-6 text-center transition-all duration-200 transform hover:scale-105 ${getScoreBgColor(score)}`}>
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
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className={`text-xl font-semibold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          out of 100
        </div>
      </div>
    </div>
  );
};

QualityScore.propTypes = {
  score: PropTypes.number.isRequired,
};

export default memo(QualityScore);
