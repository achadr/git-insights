import { memo } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * ComplexityChart - Heatmap visualization showing file complexity
 * Displays top 10 most complex files with color gradient from green (simple) to red (complex)
 */
const ComplexityChart = ({ files }) => {
  // Validate and prepare data
  if (!files || files.length === 0) {
    return (
      <div
        className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
        role="status"
        aria-label="No complexity data available"
      >
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          File Complexity
        </h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No file complexity data available</p>
        </div>
      </div>
    );
  }

  // Sort by complexity/score and take top 10
  const sortedFiles = [...files]
    .sort((a, b) => (b.complexity || b.score || 0) - (a.complexity || a.score || 0))
    .slice(0, 10)
    .map(file => ({
      name: truncateFileName(file.name || file.path || 'Unknown', 30),
      fullName: file.name || file.path || 'Unknown',
      complexity: file.complexity || file.score || 0,
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {data.fullName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complexity: <span className="font-semibold">{data.complexity.toFixed(1)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
      role="region"
      aria-label="File complexity chart showing top 10 most complex files"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          File Complexity
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Top {sortedFiles.length} files
        </div>
      </div>

      {/* Complexity Legend */}
      <div className="flex items-center justify-end gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">High</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={400} minWidth={500}>
          <BarChart
            data={sortedFiles}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis
              type="number"
              domain={[0, 'dataMax']}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Complexity Score',
                position: 'insideBottom',
                offset: -5,
                style: { fill: '#6b7280', fontSize: 12 }
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar
              dataKey="complexity"
              radius={[0, 4, 4, 0]}
            >
              {sortedFiles.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getComplexityColor(entry.complexity)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Get color based on complexity score
 * Green (simple) to Yellow (moderate) to Red (complex)
 */
const getComplexityColor = (complexity) => {
  if (complexity >= 80) return '#dc2626'; // red-600 - very complex
  if (complexity >= 60) return '#f97316'; // orange-500 - complex
  if (complexity >= 40) return '#eab308'; // yellow-500 - moderate
  if (complexity >= 20) return '#84cc16'; // lime-500 - low
  return '#22c55e'; // green-500 - simple
};

/**
 * Truncate file name if too long
 */
const truncateFileName = (name, maxLength) => {
  if (name.length <= maxLength) return name;

  // Try to keep file extension visible
  const parts = name.split('/');
  const fileName = parts[parts.length - 1];

  if (fileName.length <= maxLength) {
    return `.../${fileName}`;
  }

  return fileName.substring(0, maxLength - 3) + '...';
};

ComplexityChart.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      path: PropTypes.string,
      complexity: PropTypes.number,
      score: PropTypes.number,
    })
  ).isRequired,
};

export default memo(ComplexityChart);
