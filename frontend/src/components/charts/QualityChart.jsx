import { memo } from 'react';
import PropTypes from 'prop-types';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { getScoreColor, getScoreLabel } from '../../utils/scoreUtils';

/**
 * QualityChart - Displays overall code quality score as a gauge-style visualization
 *
 * Color coding:
 * - 80-100: green (excellent)
 * - 60-79: blue (good)
 * - 40-59: yellow (fair)
 * - 0-39: red (poor)
 */
const QualityChart = ({ score }) => {
  // Validate score
  const validScore = Math.min(Math.max(score || 0, 0), 100);

  // Prepare data for RadialBarChart
  const data = [
    {
      name: 'Quality',
      value: validScore,
      fill: getChartFillColor(validScore),
    }
  ];

  // Handle empty or invalid data
  if (validScore === 0) {
    return (
      <div
        className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center"
        role="status"
        aria-label="No quality data available"
      >
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Quality Score
        </h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center transition-all duration-200 hover:shadow-lg"
      role="region"
      aria-label={`Quality score: ${validScore} out of 100, ${getScoreLabel(validScore)}`}
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Quality Score
      </h3>

      {/* Radial Bar Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={24}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#e5e7eb' }}
              dataKey="value"
              cornerRadius={10}
              label={{
                position: 'center',
                fill: getChartTextColor(validScore),
                fontSize: '48px',
                fontWeight: 'bold',
                formatter: (value) => value,
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Score Label Below Chart */}
        <div className="mt-2 space-y-1">
          <div className={`text-xl font-semibold ${getScoreColor(validScore)}`}>
            {getScoreLabel(validScore)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            out of 100
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get fill color for chart based on score
 */
const getChartFillColor = (score) => {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#2563eb'; // blue-600
  if (score >= 40) return '#ca8a04'; // yellow-600
  return '#dc2626'; // red-600
};

/**
 * Get text color for chart label based on score
 */
const getChartTextColor = (score) => {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#2563eb'; // blue-600
  if (score >= 40) return '#ca8a04'; // yellow-600
  return '#dc2626'; // red-600
};

QualityChart.propTypes = {
  score: PropTypes.number.isRequired,
};

export default memo(QualityChart);
