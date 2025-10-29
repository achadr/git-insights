---
description: Create a new React component with proper structure and styling
allowed_tools: [Write, Read, Edit]
---

# Add Component Command

Create a new React component following best practices.

## Component Template
````jsx
// components/[category]/[ComponentName].jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export function ComponentName({ prop1, prop2, onAction }) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleEvent = () => {
    // Event handling
    onAction?.();
  };
  
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
}

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  onAction: PropTypes.func,
};

ComponentName.defaultProps = {
  prop2: 0,
};
````

## Steps to Create Component

### 1. Determine Component Category

Place in appropriate directory:
- `layout/` - Headers, footers, sidebars
- `dashboard/` - Dashboard-specific components
- `charts/` - Data visualizations
- `forms/` - Form inputs and controls
- `common/` - Reusable components

### 2. Create Component File
````bash
# Create file
touch frontend/src/components/[category]/[ComponentName].jsx
````

### 3. Implement Component

Follow the template above, customizing:
- Props needed
- State management
- Event handlers
- JSX structure
- Styling classes

### 4. Add Styling

Use Tailwind CSS classes:
````jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">
    {title}
  </h3>
  {/* Content */}
</div>
````

### 5. Create Test
````javascript
// tests/components/[category]/[ComponentName].test.jsx
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../../../src/components/[category]/ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
````

### 6. Export from Index
````javascript
// components/[category]/index.js
export { ComponentName } from './ComponentName';
````

## Common Component Types

### Display Component
````jsx
export function DataCard({ title, value, icon }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
````

### Form Component
````jsx
export function SearchForm({ onSubmit }) {
  const [value, setValue] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border rounded px-4 py-2"
      />
      <button type="submit">Search</button>
    </form>
  );
}
````

### List Component
````jsx
export function ItemList({ items, onItemClick }) {
  if (items.length === 0) {
    return <p>No items</p>;
  }
  
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="p-4 border rounded cursor-pointer hover:bg-gray-50"
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}
````

## Best Practices

1. **Single Responsibility**: One component, one purpose
2. **Props Validation**: Use PropTypes or TypeScript
3. **Default Props**: Provide sensible defaults
4. **Composability**: Build with smaller components
5. **Accessibility**: Use semantic HTML and ARIA
6. **Performance**: Use memo, useMemo, useCallback when needed
7. **Error Boundaries**: Wrap error-prone components
8. **Testing**: Test critical functionality

## Checklist

- [ ] Component created in correct directory
- [ ] Props properly typed
- [ ] State managed correctly
- [ ] Event handlers implemented
- [ ] Styled with Tailwind
- [ ] Responsive design
- [ ] Accessibility considered
- [ ] Test file created
- [ ] Exported from index
- [ ] Documentation added (if complex)