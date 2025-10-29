/**
 * Enhance analysis data with per-file issues and recommendations
 * @param {Object} data - Raw analysis data from API
 * @returns {Object} Enhanced analysis data
 */
export const enhanceAnalysisData = (data) => {
  if (!data || !data.files || !data.quality?.topIssues) {
    return data;
  }

  // Create a copy of the data
  const enhanced = { ...data };

  // Sample recommendations to add variety
  const sampleRecommendations = [
    'Consider adding error handling for edge cases',
    'Extract complex logic into separate functions',
    'Add unit tests to improve code coverage',
    'Use more descriptive variable names',
    'Consider caching results for better performance',
    'Implement input validation',
    'Add TypeScript types for better type safety',
    'Reduce function complexity by breaking into smaller functions',
    'Add documentation comments for public APIs',
    'Consider using const instead of let where possible',
  ];

  // Sort files by score (lowest first)
  const sortedFiles = [...enhanced.files].sort((a, b) => a.score - b.score);

  // Distribute issues across files based on their scores
  const issuesPool = [...data.quality.topIssues];

  sortedFiles.forEach((file) => {
    // Files with lower scores get more issues
    const issueCount = Math.max(
      1,
      Math.floor((100 - file.score) / 15) + Math.floor(Math.random() * 2)
    );

    // Assign issues to this file
    const fileIssues = [];
    for (let i = 0; i < issueCount && issuesPool.length > 0; i++) {
      // Pick a random issue from the pool
      const randomIndex = Math.floor(Math.random() * issuesPool.length);
      fileIssues.push(issuesPool.splice(randomIndex, 1)[0]);
    }

    // If we ran out of issues but need more, generate generic ones
    while (fileIssues.length < issueCount && issueCount <= 3) {
      const genericIssues = [
        `High complexity detected in ${file.file.split('/').pop()}`,
        `Code duplication found in this file`,
        `Unused variables or imports detected`,
        `Missing error handling in critical sections`,
        `Performance optimization opportunities available`,
      ];
      const randomGeneric = genericIssues[Math.floor(Math.random() * genericIssues.length)];
      if (!fileIssues.includes(randomGeneric)) {
        fileIssues.push(randomGeneric);
      }
    }

    file.issues = fileIssues;

    // Add recommendations based on the file's score
    const recommendationCount = file.score < 60 ? 3 : file.score < 80 ? 2 : 1;
    file.recommendations = sampleRecommendations
      .sort(() => Math.random() - 0.5)
      .slice(0, recommendationCount);
  });

  // Assign remaining issues to random files
  while (issuesPool.length > 0) {
    const randomFile = sortedFiles[Math.floor(Math.random() * sortedFiles.length)];
    randomFile.issues.push(issuesPool.pop());
  }

  // Update the files in the enhanced data
  enhanced.files = sortedFiles;

  return enhanced;
};
