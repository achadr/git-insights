---
name: react-component
description: Creates React components with modern patterns, TypeScript support, and TailwindCSS
allowed_tools: [Write, Read, Edit]
---

# React Component Skill

I create production-ready React components following modern best practices.

## Component Patterns

### 1. Functional Components with Hooks
````jsx
import { useState, useEffect } from 'react';

export function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
````

### 2. Custom Hooks
````jsx
// hooks/useAnalysis.js
import { useQuery } from '@tanstack/react-query';
import { fetchAnalysis } from '../services/api';

export function useAnalysis(repoUrl) {
  return useQuery({
    queryKey: ['analysis', repoUrl],
    queryFn: () => fetchAnalysis(repoUrl),
    enabled: !!repoUrl,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// Usage in component
function AnalysisView({ repoUrl }) {
  const { data, isLoading, error } = useAnalysis(repoUrl);
  // ...
}
````

### 3. Context for State Management
````jsx
// context/AnalysisContext.jsx
import { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [currentRepo, setCurrentRepo] = useState(null);
  const [history, setHistory] = useState([]);
  
  const value = {
    currentRepo,
    setCurrentRepo,
    history,
    addToHistory: (repo) => setHistory(prev => [...prev, repo]),
  };
  
  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider');
  }
  return context;
}
````

## Component Structure

### Complete Component Example
````jsx
// components/dashboard/QualityScore.jsx
import { useMemo } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { ScoreGauge } from '../charts/ScoreGauge';

export function QualityScore({ repoUrl }) {
  const { data, isLoading, error } = useAnalysis(repoUrl);
  
  // Memoize expensive calculations
  const scoreColor = useMemo(() => {
    if (!data) return 'gray';
    if (data.score >= 80) return 'green';
    if (data.score >= 60) return 'blue';
    if (data.score >= 40) return 'yellow';
    return 'red';
  }, [data?.score]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Code Quality Score
      </h3>
      
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-5xl font-bold text-${scoreColor}-600`}>
            {data.score}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            out of 100
          </div>
        </div>
        
        <ScoreGauge score={data.score} color={scoreColor} />
      </div>
      
      <div className="mt-6 space-y-2">
        {data.issues.map((issue, index) => (
          <IssueItem key={index} issue={issue} />
        ))}
      </div>
    </div>
  );
}

function IssueItem({ issue }) {
  return (
    <div className="flex items-start space-x-2 text-sm">
      <span className="text-red-500">•</span>
      <span className="text-gray-700">{issue.description}</span>
    </div>
  );
}
````

## Common Components

### Button Component
````jsx
// components/common/Button.jsx
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) {
  const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
````

### Card Component
````jsx
// components/common/Card.jsx
export function Card({ 
  title, 
  subtitle,
  children, 
  actions,
  variant = 'default' 
}) {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };
  
  return (
    <div className={`rounded-lg border shadow-sm ${variants[variant]}`}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-800">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex space-x-2">{actions}</div>}
          </div>
        </div>
      )}
      
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}
````

### Loading Spinner
````jsx
// components/common/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg
        className="animate-spin text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
````

### Error Message
````jsx
// components/common/ErrorMessage.jsx
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {message}
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                Try again →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
````

## Form Components

### Input Component
````jsx
// components/forms/Input.jsx
export function Input({
  label,
  error,
  helperText,
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <input
        className={`
          w-full px-4 py-2 border rounded-md
          focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-blue-500'
          }
        `}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
````

### Repository URL Input
````jsx
// components/forms/RepoUrlInput.jsx
import { useState } from 'react';
import { Input } from './Input';
import { Button } from '../common/Button';

export function RepoUrlInput({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const validateUrl = (url) => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+/;
    return githubPattern.test(url);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!url) {
      setError('Please enter a repository URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }
    
    // Clear error
    setError('');
    setIsLoading(true);
    
    try {
      await onSubmit(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="GitHub Repository URL"
        type="url"
        placeholder="https://github.com/username/repository"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={error}
        helperText="Enter the URL of the repository you want to analyze"
      />
      
      <Button
        type="submit"
        loading={isLoading}
        disabled={!url}
        className="w-full"
      >
        Analyze Repository
      </Button>
    </form>
  );
}
````

## Chart Components

### Score Gauge
````jsx
// components/charts/ScoreGauge.jsx
import { PieChart, Pie, Cell } from 'recharts';

export function ScoreGauge({ score, color }) {
  const data = [
    { value: score },
    { value: 100 - score },
  ];
  
  const COLORS = {
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    red: '#ef4444',
    gray: '#9ca3af',
  };
  
  return (
    <PieChart width={120} height={120}>
      <Pie
        data={data}
        cx={60}
        cy={60}
        startAngle={180}
        endAngle={0}
        innerRadius={40}
        outerRadius={60}
        dataKey="value"
      >
        <Cell fill={COLORS[color]} />
        <Cell fill="#f3f4f6" />
      </Pie>
    </PieChart>
  );
}
````

## Layout Components

### Page Layout
````jsx
// components/layout/Layout.jsx
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
````

### Header
````jsx
// components/layout/Header.jsx
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              GitInsights
            </div>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/examples"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Examples
            </Link>
            <Link
              to="/docs"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Docs
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
````

## Best Practices

1. **Props Validation**: Use PropTypes or TypeScript
2. **Memoization**: Use `useMemo` and `useCallback` for expensive operations
3. **Error Boundaries**: Wrap components that might fail
4. **Accessibility**: Use semantic HTML and ARIA labels
5. **Loading States**: Always show loading indicators
6. **Error States**: Always handle and display errors
7. **Responsive Design**: Mobile-first approach
8. **Performance**: Lazy load heavy components

## Testing
````jsx
// tests/components/QualityScore.test.jsx
import { render, screen } from '@testing-library/react';
import { QualityScore } from '../QualityScore';

describe('QualityScore', () => {
  it('renders loading state', () => {
    render(<QualityScore repoUrl="test" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('renders score when loaded', async () => {
    render(<QualityScore repoUrl="test" />);
    expect(await screen.findByText('85')).toBeInTheDocument();
  });
});
````