# Chart Components Usage Guide

This document provides examples of how to use the chart components in the GitInsights frontend.

## Import Statements

```jsx
// Import individual components
import QualityChart from './components/charts/QualityChart';
import ComplexityChart from './components/charts/ComplexityChart';
import TrendChart from './components/charts/TrendChart';

// Or import all at once
import { QualityChart, ComplexityChart, TrendChart } from './components/charts';
```

---

## 1. QualityChart

Displays overall code quality score (0-100) as a gauge-style visualization.

### Props

- `score` (number, required): Quality score from 0-100

### Example Usage

```jsx
import { QualityChart } from './components/charts';

function QualityDashboard({ analysisData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <QualityChart score={analysisData.overallScore} />
    </div>
  );
}
```

### Example with Loading State

```jsx
import { QualityChart } from './components/charts';
import LoadingSpinner from './components/common/LoadingSpinner';

function QualityDashboard() {
  const { data, isLoading } = useAnalysisData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <QualityChart score={data.quality.overall} />;
}
```

### Color Coding

- **80-100**: Green (Excellent)
- **60-79**: Blue (Good)
- **40-59**: Yellow (Fair)
- **0-39**: Red (Poor)

---

## 2. ComplexityChart

Heatmap visualization showing file complexity for the top 10 most complex files.

### Props

- `files` (array, required): Array of file objects with the following shape:
  ```javascript
  {
    name: string,        // File name or path
    complexity: number,  // Complexity score (or use 'score')
    score: number        // Alternative to complexity
  }
  ```

### Example Usage

```jsx
import { ComplexityChart } from './components/charts';

function ComplexityDashboard({ analysisData }) {
  const complexFiles = analysisData.files.map(file => ({
    name: file.path,
    complexity: file.complexityScore,
  }));

  return (
    <div className="space-y-6">
      <ComplexityChart files={complexFiles} />
    </div>
  );
}
```

### Example with Real API Data

```jsx
import { ComplexityChart } from './components/charts';
import { useQuery } from '@tanstack/react-query';

function ComplexityView({ repoUrl }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['complexity', repoUrl],
    queryFn: () => fetchComplexityData(repoUrl),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return <ComplexityChart files={data.files} />;
}
```

### Data Format Example

```javascript
const sampleFiles = [
  { name: 'src/utils/analyzer.js', complexity: 85 },
  { name: 'src/components/Dashboard.jsx', complexity: 72 },
  { name: 'backend/services/github.js', complexity: 68 },
  { name: 'src/hooks/useAnalysis.js', complexity: 45 },
  { name: 'src/utils/scoreUtils.js', complexity: 32 },
];
```

---

## 3. TrendChart

Line chart showing quality, security, and performance trends over time.

### Props

- `data` (array, required): Array of data points with the following shape:
  ```javascript
  {
    date: string,           // ISO date string or formatted date
    quality: number,        // Quality score (0-100)
    security: number,       // Security score (0-100)
    performance: number     // Performance score (0-100)
  }
  ```

### Example Usage

```jsx
import { TrendChart } from './components/charts';

function TrendsView({ historicalData }) {
  const trendData = historicalData.map(point => ({
    date: point.timestamp,
    quality: point.qualityScore,
    security: point.securityScore,
    performance: point.performanceScore,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Historical Trends</h2>
      <TrendChart data={trendData} />
    </div>
  );
}
```

### Example with Mock Data

```jsx
import { TrendChart } from './components/charts';

function TrendsDemo() {
  const mockData = [
    { date: '2024-01-01', quality: 75, security: 80, performance: 70 },
    { date: '2024-01-08', quality: 78, security: 82, performance: 72 },
    { date: '2024-01-15', quality: 80, security: 85, performance: 75 },
    { date: '2024-01-22', quality: 82, security: 87, performance: 78 },
    { date: '2024-01-29', quality: 85, security: 90, performance: 82 },
  ];

  return <TrendChart data={mockData} />;
}
```

### Features

- Multiple metrics on the same chart
- Interactive tooltips on hover
- Automatic average calculation displayed below chart
- Color-coded lines:
  - **Blue**: Quality
  - **Red**: Security
  - **Green**: Performance

---

## Complete Dashboard Example

Here's a complete example combining all three charts:

```jsx
import { QualityChart, ComplexityChart, TrendChart } from './components/charts';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorMessage from './components/common/ErrorMessage';

function AnalyticsDashboard({ repoUrl }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', repoUrl],
    queryFn: () => fetchAnalyticsData(repoUrl),
  });

  if (isLoading) {
    return <LoadingSpinner withSkeleton />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Quality Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QualityChart score={data.overallScore} />

        {/* Additional metrics can go here */}
      </div>

      {/* Complexity Chart */}
      <ComplexityChart files={data.files} />

      {/* Trends Chart */}
      <TrendChart data={data.historicalTrends} />
    </div>
  );
}

export default AnalyticsDashboard;
```

---

## Responsive Design

All charts are fully responsive and follow mobile-first principles:

- **Mobile (< 640px)**: Charts stack vertically with adjusted heights
- **Tablet (640px - 1024px)**: Charts use 2-column grid where appropriate
- **Desktop (> 1024px)**: Full-width layouts with optimal spacing

---

## Accessibility Features

All chart components include:

- ARIA labels for screen readers
- Semantic HTML structure
- Keyboard navigation support (via Recharts)
- High contrast color schemes
- Loading and error states

---

## Dark Mode Support

All charts automatically adapt to dark mode using Tailwind's dark mode classes:

```jsx
// Charts will automatically respond to dark mode
<html className="dark">
  {/* Charts use dark:bg-gray-800, dark:text-gray-200, etc. */}
</html>
```

---

## Testing Examples

```jsx
import { render, screen } from '@testing-library/react';
import { QualityChart, ComplexityChart, TrendChart } from './components/charts';

describe('QualityChart', () => {
  it('renders quality score correctly', () => {
    render(<QualityChart score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('handles zero score gracefully', () => {
    render(<QualityChart score={0} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('ComplexityChart', () => {
  it('renders file complexity data', () => {
    const files = [
      { name: 'test.js', complexity: 75 }
    ];
    render(<ComplexityChart files={files} />);
    expect(screen.getByText(/File Complexity/i)).toBeInTheDocument();
  });

  it('handles empty files array', () => {
    render(<ComplexityChart files={[]} />);
    expect(screen.getByText(/No file complexity data/i)).toBeInTheDocument();
  });
});

describe('TrendChart', () => {
  it('renders trend data correctly', () => {
    const data = [
      { date: '2024-01-01', quality: 75, security: 80, performance: 70 }
    ];
    render(<TrendChart data={data} />);
    expect(screen.getByText(/Quality Trends/i)).toBeInTheDocument();
  });
});
```

---

## Performance Optimization

All charts use `React.memo` to prevent unnecessary re-renders:

```jsx
// Charts only re-render when props change
const MemoizedQualityChart = memo(QualityChart);
```

For best performance:
- Memoize data transformations with `useMemo`
- Debounce data updates if polling
- Use React Query for automatic caching

---

## Common Issues and Solutions

### Chart Not Displaying

**Problem**: Chart shows empty space
**Solution**: Ensure data is in the correct format and not undefined

```jsx
// Bad
<QualityChart score={data?.score} />

// Good - provide default
<QualityChart score={data?.score || 0} />
```

### Chart Overflow on Mobile

**Problem**: Chart is cut off on small screens
**Solution**: Charts are already responsive, but ensure parent has proper width

```jsx
<div className="w-full overflow-x-auto">
  <ComplexityChart files={files} />
</div>
```

### Dark Mode Colors Not Working

**Problem**: Charts don't change in dark mode
**Solution**: Ensure Tailwind dark mode is configured in `tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

---

## Further Customization

To customize chart colors or styles, modify the color constants in each component:

```jsx
// In QualityChart.jsx
const getChartFillColor = (score) => {
  if (score >= 80) return '#your-custom-green';
  // ...
};
```

For more advanced customization, refer to the [Recharts documentation](https://recharts.org/).
