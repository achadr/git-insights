# Dashboard Components

## Component Hierarchy

```
AnalysisDashboard (Main Container)
│
├── QualityScore
│   └── Displays overall quality score with color coding
│
├── Analysis Summary Card
│   ├── Files Count (blue)
│   ├── Issues Count (red)
│   └── Average Score (purple)
│
├── FilesOverview
│   ├── Visual Bar Chart
│   ├── Category Legend (Excellent, Good, Fair, Poor)
│   └── Summary Stats
│
└── ExpandableFilesList
    ├── Search & Sort Controls
    │   ├── Search Input (filter by filename)
    │   └── Sort Dropdown (score/name, asc/desc)
    │
    └── FileCard[] (for each file)
        ├── Header (always visible)
        │   ├── File Icon
        │   ├── File Name
        │   ├── Score Label (Excellent/Good/Fair/Needs Work)
        │   ├── Issue Count
        │   ├── Score Badge (colored)
        │   └── Expand/Collapse Icon
        │
        └── Expandable Content (shown on click)
            ├── Issues Section
            │   └── Issue[] (with categorized icons)
            │       ├── Security (red warning)
            │       ├── Performance (orange lightning)
            │       ├── Complexity (purple chart)
            │       ├── Style (blue brush)
            │       └── General (gray info)
            │
            └── Recommendations Section
                └── Recommendation[] (with green checkmark)
```

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│                  AnalysisDashboard                  │
├───────────────────┬─────────────────────────────────┤
│                   │                                 │
│  QualityScore     │   Analysis Summary              │
│  (1 column)       │   (2 columns)                   │
│                   │   ┌─────┬─────┬─────┐          │
│  ┌─────────────┐  │   │Files│Issues│Avg │          │
│  │   Score:    │  │   │  10 │  25  │ 78 │          │
│  │     78      │  │   └─────┴─────┴─────┘          │
│  │  out of 100 │  │                                 │
│  └─────────────┘  │                                 │
└───────────────────┴─────────────────────────────────┤
│                                                      │
│  FilesOverview (Full Width)                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ ████████░░░░░░░░                               │ │
│  │ [Excellent: 4] [Good: 3] [Fair: 2] [Poor: 1]  │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┤
│                                                      │
│  ExpandableFilesList (Full Width)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ [Search...] [Sort: Score Low to High ▼]       │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ FileCard ─────────────────────────────────────┐ │
│  │ 📄 src/components/App.jsx  [Needs Work] [45] ▼│ │
│  ├────────────────────────────────────────────────┤ │
│  │ ⚠️ Issues:                                     │ │
│  │   • Security vulnerability in authentication  │ │
│  │   • High complexity detected                  │ │
│  │                                                │ │
│  │ 💡 Recommendations:                            │ │
│  │   • Extract complex logic                     │ │
│  │   • Add error handling                        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ FileCard ─────────────────────────────────────┐ │
│  │ 📄 src/utils/helpers.js  [Fair] [67] ►        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ FileCard ─────────────────────────────────────┐ │
│  │ 📄 src/components/Header.jsx  [Good] [82] ►   │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Component Details

### FileCard States

#### Collapsed (Default)
- Shows file path, score badge, issue count
- Compact view for scanning multiple files
- Color-coded border matches score

#### Expanded (On Click)
- Reveals all issues with categorized icons
- Shows AI recommendations
- Smooth slide-down animation
- Can collapse by clicking header again

### Color Coding

| Score Range | Category  | Colors                                    |
|-------------|-----------|-------------------------------------------|
| 80-100      | Excellent | Green background, green text, green badge |
| 60-79       | Good      | Blue background, blue text, blue badge    |
| 40-59       | Fair      | Yellow background, yellow text, yellow badge |
| 0-39        | Poor      | Red background, red text, red badge       |

### Issue Icons

| Type        | Icon           | Color  |
|-------------|----------------|--------|
| Security    | ⚠️ Triangle    | Red    |
| Performance | ⚡ Lightning   | Orange |
| Complexity  | 📊 Bar Chart   | Purple |
| Style       | 🎨 Brush       | Blue   |
| General     | ℹ️ Info Circle | Gray   |

## Responsive Behavior

### Desktop (1024px+)
- Three-column summary stats
- Search and sort side-by-side
- Comfortable spacing

### Tablet (640px - 1024px)
- Two-column summary stats
- Search and sort side-by-side
- Compact spacing

### Mobile (< 640px)
- Single column summary stats (stacked)
- Search full width
- Sort full width below search
- Touch-optimized buttons

## Data Flow

```
HomePage
  │
  ├─ Fetch from API (analyzeRepository)
  │
  ├─ enhanceAnalysisData()
  │   ├─ Distribute global issues to files
  │   ├─ Assign more issues to lower-scoring files
  │   └─ Add recommendations per file
  │
  └─ Pass to AnalysisDashboard
      │
      ├─ Calculate totalIssues
      │
      ├─ Pass score to QualityScore
      │
      ├─ Pass files to FilesOverview
      │
      └─ Pass files to ExpandableFilesList
          │
          ├─ Filter by searchTerm
          ├─ Sort by sortBy
          │
          └─ Map to FileCard
              └─ Render expandable content
```

## Key Features

### 1. Intelligent Issue Distribution
- Lower-scoring files get more issues
- Random distribution to avoid patterns
- Generates additional issues if needed

### 2. Search Functionality
- Filter files by name (case-insensitive)
- Real-time filtering
- Shows match count

### 3. Sort Options
- Score: Low to High (default - highlights problems)
- Score: High to Low (highlights successes)
- Name: A to Z (alphabetical)
- Name: Z to A (reverse alphabetical)

### 4. Visual Feedback
- Color-coded cards by score
- Animated expand/collapse
- Hover effects
- Loading states
- Empty states

### 5. Accessibility
- Keyboard navigation
- Focus indicators
- ARIA labels
- Semantic HTML
- Screen reader friendly

## Usage Example

```jsx
import AnalysisDashboard from './components/dashboard/AnalysisDashboard';

// In your component
const [analysis, setAnalysis] = useState(null);

// After fetching and enhancing data
<AnalysisDashboard data={analysis} />

// Expected data structure
{
  summary: {
    filesAnalyzed: 10,
    overallQuality: 78,
    timestamp: "2025-10-29T..."
  },
  quality: {
    score: 78,
    issueCount: 15,
    topIssues: [...]
  },
  files: [
    {
      file: "src/App.jsx",
      score: 85,
      issues: [
        "Security issue...",
        "Performance issue..."
      ],
      recommendations: [
        "Add error handling...",
        "Extract complex logic..."
      ]
    }
  ]
}
```

## Performance Tips

1. **Use useMemo for expensive calculations** (already implemented in ExpandableFilesList)
2. **Avoid rendering all expanded content at once** (only render when expanded)
3. **Use CSS transforms for animations** (hardware-accelerated)
4. **Lazy load file content** if dealing with 100+ files
5. **Debounce search input** if needed for very large datasets

## Customization

### Changing Colors
Edit color classes in:
- `FileCard.jsx` - `getScoreColor()` function
- `FilesOverview.jsx` - `categories` array

### Changing Score Thresholds
Edit conditions in:
- `FileCard.jsx` - `getScoreColor()`, `getScoreLabel()`
- `FilesOverview.jsx` - `categories` filters

### Adding New Issue Types
Add to `FileCard.jsx` - `getIssueIcon()` function:
```jsx
if (lowerIssue.includes('your-keyword')) {
  return <YourIcon className="w-5 h-5 text-your-color" />;
}
```

### Modifying Sort Options
Add to `ExpandableFilesList.jsx` - `processedFiles` useMemo:
```jsx
case 'your-sort':
  return /* your sorting logic */;
```
