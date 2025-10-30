# GitInsights Frontend - Quick Start Guide

## New Features Overview

### 1. Dark Mode
**How to use:**
- Click the toggle switch in the header (moon/sun icon)
- Keyboard shortcut: `Ctrl + D`
- Automatically saves your preference

### 2. Keyboard Shortcuts
**Press `?` to see all shortcuts**

Quick reference:
- `Ctrl + K` - Focus search
- `Ctrl + D` - Toggle dark mode
- `Ctrl + P` - Print report
- `Escape` - Close modals

### 3. Export Data
**Location:** Click "Export Data" button in the analysis dashboard header

**Available formats:**
- JSON - Complete data for programmatic use
- CSV (Detailed) - All files with issues and recommendations
- CSV (Summary) - High-level metrics only

### 4. Copy to Clipboard
**Where:** Next to file names in the file list

**How to use:**
- Click the "Copy" button next to any file path
- Button changes to "Copied!" with green color
- Automatically resets after 2 seconds

### 5. Search and Filter
**Location:** File Analysis section

**Features:**
- Type in search box to filter files by name
- Sort by: Score (low/high) or Name (A-Z)
- Clear search with X button or ESC key

### 6. Tooltips
**How to use:**
- Hover over UI elements to see helpful tooltips
- Available on quality scores, file names, and action buttons

### 7. Print Reports
**How to use:**
- Press `Ctrl + P` or use browser print
- Report automatically optimizes for printing
- All collapsed sections expand automatically

---

## For Developers

### Project Structure

```
src/
├── components/
│   ├── common/           # Reusable components
│   │   ├── CopyButton.jsx
│   │   ├── Tooltip.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── ExportDataButton.jsx
│   │   ├── KeyboardShortcutsModal.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorMessage.jsx
│   ├── dashboard/        # Dashboard components
│   │   ├── AnalysisDashboard.jsx
│   │   ├── QualityScore.jsx
│   │   ├── FileCard.jsx
│   │   ├── FilesOverview.jsx
│   │   └── ExpandableFilesList.jsx
│   ├── forms/           # Form components
│   │   └── RepoUrlInput.jsx
│   └── layout/          # Layout components
│       ├── Layout.jsx
│       ├── Header.jsx
│       └── Footer.jsx
├── contexts/            # React contexts
│   └── ThemeContext.jsx
├── hooks/               # Custom hooks
│   ├── useCopyToClipboard.js
│   └── useKeyboardShortcuts.js
├── utils/               # Utility functions
│   ├── dataExport.js
│   └── pdfExport.js
├── pages/               # Page components
│   └── HomePage.jsx
├── services/            # API services
│   └── api.js
└── styles/              # Global styles
    └── index.css
```

### Key Technologies
- React 18
- TailwindCSS (with dark mode)
- React Context API (theme management)
- Custom hooks for reusable logic
- No additional dependencies required

### Running the Application

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Customizing the Theme

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Adding New Keyboard Shortcuts

Edit `src/hooks/useKeyboardShortcuts.js`:

```javascript
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Your Category',
    shortcuts: [
      { keys: ['Ctrl', 'X'], description: 'Your action' },
    ],
  },
];
```

Then implement in your component:

```javascript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const YourComponent = () => {
  useKeyboardShortcuts({
    'ctrl+x': () => yourAction(),
  });
  // ...
};
```

### Creating New Exporters

Add to `src/utils/dataExport.js`:

```javascript
export const exportToYourFormat = (analysisData, repoUrl) => {
  // Your export logic
  const content = transformData(analysisData);
  const filename = `export-${Date.now()}.ext`;
  downloadFile(content, filename, 'mime/type');
};
```

### Dark Mode Classes

All components support dark mode via Tailwind's `dark:` prefix:

```javascript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Your content
</div>
```

---

## Component Usage Examples

### Using CopyButton

```javascript
import CopyButton from '../components/common/CopyButton';

<CopyButton text="Text to copy" label="descriptive label" />
```

### Using Tooltip

```javascript
import Tooltip from '../components/common/Tooltip';

<Tooltip content="Helpful message" position="top">
  <button>Hover me</button>
</Tooltip>
```

### Using ThemeToggle

```javascript
import ThemeToggle from '../components/common/ThemeToggle';

<ThemeToggle />
```

### Accessing Theme Context

```javascript
import { useTheme } from '../contexts/ThemeContext';

const YourComponent = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div>
      Current theme: {isDark ? 'Dark' : 'Light'}
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};
```

---

## Styling Guidelines

### Color Palette

**Light Mode:**
- Background: `bg-gray-50` (main), `bg-white` (cards)
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)
- Borders: `border-gray-200`

**Dark Mode:**
- Background: `dark:bg-gray-900` (main), `dark:bg-gray-800` (cards)
- Text: `dark:text-white` (primary), `dark:text-gray-300` (secondary)
- Borders: `dark:border-gray-700`

**Quality Score Colors:**
- Excellent (80-100): Green - `text-green-600 dark:text-green-400`
- Good (60-79): Blue - `text-blue-600 dark:text-blue-400`
- Fair (40-59): Yellow - `text-yellow-600 dark:text-yellow-400`
- Poor (0-39): Red - `text-red-600 dark:text-red-400`

### Animation Classes

```javascript
// Fade in
className="animate-fade-in"

// Slide in
className="animate-slide-in"

// Hover scale
className="transition-transform hover:scale-105"

// Smooth color transitions
className="transition-colors duration-200"
```

---

## Troubleshooting

### Dark mode not persisting
- Check browser's localStorage permissions
- Clear localStorage and try again: `localStorage.clear()`

### Keyboard shortcuts not working
- Ensure no input field is focused
- Check browser console for errors
- Verify shortcuts aren't overridden by browser

### Export not downloading
- Check browser's download settings
- Verify popup blocker isn't blocking downloads
- Check browser console for errors

### Theme toggle not visible
- Check that ThemeProvider wraps the app in `main.jsx`
- Verify Header component includes ThemeToggle

---

## Performance Tips

1. **Memoization**: Use React.memo for components that re-render frequently
2. **useMemo**: Wrap expensive calculations in useMemo
3. **Lazy Loading**: Use React.lazy() for large components
4. **Code Splitting**: Vite handles this automatically

---

## Accessibility Checklist

- [ ] All interactive elements have keyboard access
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] ARIA labels on all interactive elements
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers

---

## Browser Support

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (custom scrollbar not supported)
- **Mobile Safari**: ✅ Responsive design tested
- **Mobile Chrome**: ✅ Responsive design tested

---

## Getting Help

- Check the main documentation: `FRONTEND_IMPROVEMENTS.md`
- Review component source code for usage examples
- Check the keyboard shortcuts modal (`?` key) for available shortcuts

---

## Contributing

When adding new features:

1. **Follow existing patterns**: Look at similar components
2. **Add dark mode support**: Include `dark:` classes
3. **Make it responsive**: Test on mobile devices
4. **Add keyboard shortcuts**: If applicable
5. **Include tooltips**: For better UX
6. **Update documentation**: Add to this guide

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test
```

---

Happy coding! 🚀
