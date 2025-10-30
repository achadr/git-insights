import { memo } from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * TrendChart - Line chart showing quality/security trends over time
 * Supports multiple metrics on the same chart with tooltips and legends
 */
const TrendChart = ({ data }) => {
  // Validate data
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
        role="status"
        aria-label="No trend data available"
      >
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Quality Trends
        </h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
        </div>
      </div>
    );
  }

  // Format data with proper date labels
  const formattedData = data.map(item => ({
    ...item,
    dateLabel: formatDate(item.date),
    quality: item.quality || 0,
    security: item.security || 0,
    performance: item.performance || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                <span className="text-sm" style={{ color: entry.color }}>
                  {entry.name}:
                </span>
                <span className="text-sm font-semibold" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex items-center justify-center gap-6 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
      role="region"
      aria-label="Quality trends over time chart"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Quality Trends
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last {formattedData.length} data points
        </div>
      </div>

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{
              value: 'Date',
              position: 'insideBottom',
              offset: -5,
              style: { fill: '#6b7280', fontSize: 12 }
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{
              value: 'Score',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6b7280', fontSize: 12 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />

          {/* Quality Line */}
          <Line
            type="monotone"
            dataKey="quality"
            name="Quality"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Security Line */}
          <Line
            type="monotone"
            dataKey="security"
            name="Security"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ fill: '#dc2626', r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Performance Line */}
          <Line
            type="monotone"
            dataKey="performance"
            name="Performance"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ fill: '#16a34a', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <MetricSummary
          label="Quality"
          value={calculateAverage(formattedData, 'quality')}
          color="text-blue-600 dark:text-blue-400"
        />
        <MetricSummary
          label="Security"
          value={calculateAverage(formattedData, 'security')}
          color="text-red-600 dark:text-red-400"
        />
        <MetricSummary
          label="Performance"
          value={calculateAverage(formattedData, 'performance')}
          color="text-green-600 dark:text-green-400"
        />
      </div>
    </div>
  );
};

/**
 * Metric Summary Component
 */
const MetricSummary = ({ label, value, color }) => (
  <div className="text-center">
    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
      Avg {label}
    </div>
    <div className={`text-2xl font-bold ${color}`}>
      {value.toFixed(1)}
    </div>
  </div>
);

MetricSummary.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

/**
 * Calculate average for a metric
 */
const calculateAverage = (data, key) => {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (item[key] || 0), 0);
  return sum / data.length;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // Format as MM/DD
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  } catch {
    return dateString;
  }
};

TrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      quality: PropTypes.number,
      security: PropTypes.number,
      performance: PropTypes.number,
    })
  ).isRequired,
};

export default memo(TrendChart);
