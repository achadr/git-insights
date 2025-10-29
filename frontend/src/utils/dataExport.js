/**
 * Export analysis data to CSV format
 */
export const exportToCSV = (analysisData, repoUrl) => {
  if (!analysisData || !analysisData.files) {
    throw new Error('No data to export');
  }

  const timestamp = new Date().toISOString();
  const filename = `gitinsights-${repoUrl.split('/').pop()}-${Date.now()}.csv`;

  // CSV Headers
  const headers = ['File Path', 'Quality Score', 'Issues Count', 'Issues', 'Recommendations'];

  // CSV Rows
  const rows = analysisData.files.map(file => {
    const issues = (file.issues || []).map(issue =>
      typeof issue === 'string' ? issue : issue.issue
    ).join('; ');

    const recommendations = (file.recommendations || []).join('; ');

    return [
      file.file,
      file.score,
      file.issues?.length || 0,
      issues,
      recommendations,
    ];
  });

  // Create CSV content
  const csvContent = [
    `# GitInsights Analysis Export`,
    `# Repository: ${repoUrl}`,
    `# Generated: ${timestamp}`,
    `# Overall Quality: ${analysisData.summary.overallQuality}`,
    `# Files Analyzed: ${analysisData.summary.filesAnalyzed}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Download file
  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Export analysis data to JSON format
 */
export const exportToJSON = (analysisData, repoUrl) => {
  if (!analysisData) {
    throw new Error('No data to export');
  }

  const timestamp = new Date().toISOString();
  const filename = `gitinsights-${repoUrl.split('/').pop()}-${Date.now()}.json`;

  const exportData = {
    repository: repoUrl,
    exportedAt: timestamp,
    analysis: analysisData,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Export summary statistics to CSV
 */
export const exportSummaryToCSV = (analysisData, repoUrl) => {
  if (!analysisData || !analysisData.files) {
    throw new Error('No data to export');
  }

  const timestamp = new Date().toISOString();
  const filename = `gitinsights-summary-${repoUrl.split('/').pop()}-${Date.now()}.csv`;

  // Calculate statistics
  const excellent = analysisData.files.filter(f => f.score >= 80).length;
  const good = analysisData.files.filter(f => f.score >= 60 && f.score < 80).length;
  const fair = analysisData.files.filter(f => f.score >= 40 && f.score < 60).length;
  const poor = analysisData.files.filter(f => f.score < 40).length;
  const totalIssues = analysisData.files.reduce((sum, f) => sum + (f.issues?.length || 0), 0);

  const csvContent = [
    `# GitInsights Summary Export`,
    `# Repository: ${repoUrl}`,
    `# Generated: ${timestamp}`,
    '',
    'Metric,Value',
    `Overall Quality Score,${analysisData.summary.overallQuality}`,
    `Total Files Analyzed,${analysisData.summary.filesAnalyzed}`,
    `Total Issues Found,${totalIssues}`,
    `Excellent Files (80-100),${excellent}`,
    `Good Files (60-79),${good}`,
    `Fair Files (40-59),${fair}`,
    `Poor Files (0-39),${poor}`,
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Helper function to trigger file download
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
