# PDF Export Feature Documentation

## Overview

The PDF export feature allows users to download professional, visually appealing analysis reports as PDF documents. The reports include comprehensive code quality metrics, file-by-file analysis, charts, and AI-generated recommendations.

## Features

### Cover Page
- Repository name and branding
- Overall quality score with visual indicator
- Analysis timestamp
- GitInsights logo and branding

### Summary Page
- Key statistics (files analyzed, total issues, average score)
- Quality distribution visualization (stacked bar chart)
- AI-generated key insights based on analysis data

### Files Overview
- Comprehensive table of all analyzed files
- Color-coded quality scores
- Issue and recommendation counts
- Quick rating labels (Excellent/Good/Fair/Poor)

### Detailed File Analysis
- Individual page section for each file
- File path and quality score
- Visual progress bar for score
- Complete list of issues with bullet points
- Complete list of recommendations
- Professional formatting and layout

### Design Features
- Professional color coding:
  - Green (80-100): Excellent
  - Blue (60-79): Good
  - Yellow (40-59): Fair
  - Red (0-39): Poor
- Page numbers on all pages
- GitInsights branding footer
- Automatic page breaks
- Responsive text wrapping
- Visual elements (circles, bars, cards)

## File Structure

```
frontend/src/
├── utils/
│   ├── pdfExport.js                    # Main PDF generation utility
│   └── pdfExport.test.example.js       # Mock data for testing
├── components/
│   ├── common/
│   │   └── ExportPDFButton.jsx         # PDF export button component
│   └── dashboard/
│       └── AnalysisDashboard.jsx       # Updated with PDF export button
└── pages/
    └── HomePage.jsx                     # Updated to pass repoUrl prop
```

## Usage

### In the Dashboard

The PDF export button is automatically integrated into the Analysis Dashboard. When analysis data is available, users can click the "Download PDF Report" button in the top-right corner.

### Component Usage

```jsx
import ExportPDFButton from '../components/common/ExportPDFButton';

<ExportPDFButton
  analysisData={analysisData}
  repoUrl={repoUrl}
  className="optional-classes"
/>
```

### Direct Function Usage

```javascript
import { generatePDFReport } from '../utils/pdfExport';

try {
  const result = await generatePDFReport(analysisData, repoUrl);
  console.log('PDF downloaded:', result.fileName);
} catch (error) {
  console.error('Failed to generate PDF:', error);
}
```

## PDF File Naming

PDFs are automatically named with the following format:
```
GitInsights_Report_[RepoName]_[Date].pdf
```

Example: `GitInsights_Report_username_repository_10-29-2025.pdf`

## Dependencies

The feature uses the following npm packages:

- **jspdf** (v2.5.2+): Core PDF generation library
- **jspdf-autotable** (v3.8.3+): For generating tables
- **html2canvas** (v1.4.1+): For potential future image capture

Install with:
```bash
npm install jspdf jspdf-autotable html2canvas
```

## Button States

The ExportPDFButton component handles three states:

1. **Ready State**: Blue button with download icon
2. **Generating State**: Gray button with loading spinner, disabled
3. **Success/Error State**: Shows success message or error toast

## Error Handling

The PDF generation includes comprehensive error handling:

- Catches and logs all errors during generation
- Displays user-friendly error messages
- Automatically dismisses error messages after 5 seconds
- Returns detailed error information for debugging

## Testing

### Manual Testing

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Analyze a repository

3. Click "Download PDF Report" button

4. Verify the PDF contains:
   - Cover page with correct repo name
   - Summary statistics
   - Quality distribution chart
   - Files overview table
   - Detailed analysis for each file
   - Page numbers and branding

### Using Mock Data

For testing without running analysis:

```javascript
import { generatePDFReport } from './utils/pdfExport';
import { mockAnalysisData, mockRepoUrl } from './utils/pdfExport.test.example';

// In browser console or test file
generatePDFReport(mockAnalysisData, mockRepoUrl)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

## Customization

### Modifying Colors

Colors are defined in the helper function `getScoreColor()`:

```javascript
function getScoreColor(score) {
  if (score >= 80) return [34, 197, 94];   // Green
  if (score >= 60) return [59, 130, 246];  // Blue
  if (score >= 40) return [234, 179, 8];   // Yellow
  return [239, 68, 68];                     // Red
}
```

### Modifying Layout

Key layout functions in `pdfExport.js`:
- `addCoverPage()`: Cover page design
- `addSummaryPage()`: Summary layout and charts
- `addFilesOverviewTable()`: Table configuration
- `addDetailedFileAnalysis()`: Per-file pages

### Modifying Insights

The `generateKeyInsights()` function creates AI-powered insights based on analysis data. Customize the logic to add more insights or change thresholds.

## Performance Considerations

- PDF generation is asynchronous and non-blocking
- Button is disabled during generation to prevent duplicate requests
- Large repositories (100+ files) may take 2-3 seconds to generate
- Memory usage is minimal due to streaming approach

## Browser Compatibility

Tested and working in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Potential improvements for future versions:

1. **Chart Images**: Capture Recharts visualizations as images
2. **Custom Branding**: Allow users to add their own logo
3. **Email Sharing**: Send PDF directly via email
4. **Cloud Storage**: Upload to Google Drive/Dropbox
5. **Template Selection**: Multiple PDF template styles
6. **Selective Export**: Export specific files only
7. **PDF Annotations**: Add notes and highlights
8. **Comparison Reports**: Compare multiple analysis runs

## Troubleshooting

### PDF Not Downloading

1. Check browser pop-up blocker settings
2. Verify analysis data is complete
3. Check browser console for errors
4. Ensure all dependencies are installed

### Missing Content in PDF

1. Verify analysis data structure matches expected format
2. Check that all required fields exist (summary, files, etc.)
3. Review console for warnings about missing data

### Formatting Issues

1. Check that file paths are not too long (may wrap)
2. Verify text encoding for special characters
3. Ensure page breaks are working correctly

## Support

For issues or questions:
1. Check browser console for error messages
2. Review analysis data structure
3. Test with mock data first
4. Verify all dependencies are installed correctly

## License

This feature is part of the GitInsights project and follows the same license.
