# Chart Components

Professional data visualization components for the GitInsights frontend, built with Recharts and Tailwind CSS.

## Components

### 1. QualityChart
Radial gauge chart displaying overall code quality score (0-100) with color-coded severity levels.

**Props**: `{ score: number }`

### 2. ComplexityChart
Horizontal bar chart showing top 10 most complex files with color gradient visualization.

**Props**: `{ files: Array<{ name, complexity, score }> }`

### 3. TrendChart
Multi-line chart displaying historical trends for quality, security, and performance metrics.

**Props**: `{ data: Array<{ date, quality, security, performance }> }`

## Features

- Fully responsive (mobile-first design)
- Dark mode support
- Accessibility compliant (WCAG AA)
- Interactive tooltips
- Loading and error states
- Memoized for performance
- PropTypes validation

## Quick Start

```jsx
import { QualityChart, ComplexityChart, TrendChart } from './components/charts';

function Dashboard({ data }) {
  return (
    <>
      <QualityChart score={data.overallScore} />
      <ComplexityChart files={data.files} />
      <TrendChart data={data.trends} />
    </>
  );
}
```

## Documentation

See [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for detailed usage examples, API reference, and best practices.

## Design System

All charts follow the frontend-agent design system:

**Color Coding**:
- Excellent (80-100): Green
- Good (60-79): Blue
- Fair (40-59): Yellow
- Poor (0-39): Red

**Styling**: Tailwind CSS with consistent spacing, borders, and shadows

## Dependencies

- `recharts` ^2.10.3 (already installed)
- `react` ^18.2.0
- `prop-types` ^15.8.1

## Testing

All components include:
- Empty state handling
- Invalid data validation
- PropTypes warnings
- Accessibility labels

Run tests:
```bash
npm test -- charts/
```
