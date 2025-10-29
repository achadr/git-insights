---
name: code-analyzer
description: Analyzes code using Claude API and generates comprehensive quality metrics
allowed_tools: [Read, Bash]
---

# Code Analyzer Skill

I analyze code repositories using Claude API and generate detailed quality metrics, security assessments, and performance insights.

## Analysis Categories

### 1. Code Quality (0-100)
- Structure & Organization
- Naming Conventions
- Documentation
- Maintainability

### 2. Security (Low/Medium/High/Critical)
- Vulnerabilities
- Authentication Issues
- Input Validation
- Dependency Security

### 3. Performance (A-F Grade)
- Algorithm Efficiency
- Memory Usage
- Database Queries
- Optimization Opportunities

### 4. Best Practices
- Design Patterns
- SOLID Principles
- Framework Conventions
- Testing Coverage

## Claude API Prompts

### Quality Analysis Prompt
````javascript
const qualityAnalysisPrompt = (code) => `
You are a senior code reviewer. Analyze the following code and provide a detailed quality assessment.

Code:
\`\`\`
${code}
\`\`\`

Evaluate these aspects and provide scores (0-100):

1. **Structure & Organization (0-100)**
   - File organization
   - Function decomposition
   - Module separation
   - Code layout

2. **Naming & Readability (0-100)**
   - Variable names
   - Function names
   - Class names
   - Code clarity

3. **Error Handling (0-100)**
   - Try-catch usage
   - Error messages
   - Edge case handling
   - Input validation

4. **Documentation (0-100)**
   - Code comments
   - Function docs
   - README quality
   - API documentation

5. **Testing (0-100)**
   - Test coverage
   - Test quality
   - Edge case tests
   - Integration tests

For each category, provide:
- Score (0-100)
- Issues found (array)
- Recommendations (array)

Return ONLY valid JSON in this exact format:
{
  "overall": 85,
  "structure": {
    "score": 90,
    "issues": ["Long functions in auth.js"],
    "recommendations": ["Split auth.js into smaller modules"]
  },
  "naming": {
    "score": 85,
    "issues": ["Some variable names are unclear"],
    "recommendations": ["Rename 'x' to 'userId'"]
  },
  "errorHandling": {
    "score": 75,
    "issues": ["Missing error handling in API calls"],
    "recommendations": ["Add try-catch blocks"]
  },
  "documentation": {
    "score": 80,
    "issues": ["Some functions lack comments"],
    "recommendations": ["Add JSDoc comments"]
  },
  "testing": {
    "score": 90,
    "issues": [],
    "recommendations": ["Add more edge case tests"]
  }
}
`;
````

### Security Analysis Prompt
````javascript
const securityAnalysisPrompt = (code) => `
You are a security expert. Analyze the following code for security vulnerabilities.

Code:
\`\`\`
${code}
\`\`\`

Check for these security issues:

1. **SQL Injection**
   - Unsanitized SQL queries
   - String concatenation in queries

2. **Cross-Site Scripting (XSS)**
   - Unescaped user input
   - Dangerous innerHTML usage

3. **Authentication & Authorization**
   - Weak password policies
   - Missing authentication
   - Authorization bypass

4. **Sensitive Data Exposure**
   - Hardcoded secrets
   - Logging sensitive data
   - Exposing credentials

5. **Input Validation**
   - Missing validation
   - Type coercion issues
   - Injection vulnerabilities

6. **Dependency Vulnerabilities**
   - Outdated packages
   - Known CVEs

Return ONLY valid JSON:
{
  "riskLevel": "low|medium|high|critical",
  "overallScore": 75,
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "severity": "high",
      "location": "file.js:42",
      "description": "SQL query uses string concatenation",
      "recommendation": "Use parameterized queries",
      "codeSnippet": "SELECT * FROM users WHERE id = " + userId
    }
  ],
  "summary": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 3
  }
}
`;
````

### Performance Analysis Prompt
````javascript
const performanceAnalysisPrompt = (code) => `
You are a performance optimization expert. Analyze this code for performance issues.

Code:
\`\`\`
${code}
\`\`\`

Evaluate:

1. **Algorithm Efficiency**
   - Time complexity
   - Space complexity
   - Unnecessary iterations

2. **Memory Usage**
   - Memory leaks
   - Unnecessary allocations
   - Large object creation

3. **Database Operations**
   - N+1 query problems
   - Missing indexes
   - Inefficient queries

4. **Optimization Opportunities**
   - Caching possibilities
   - Lazy loading
   - Code splitting

Return ONLY valid JSON:
{
  "grade": "A|B|C|D|F",
  "score": 85,
  "issues": [
    {
      "type": "Algorithm Efficiency",
      "severity": "medium",
      "location": "utils.js:25",
      "description": "Nested loop creates O(n²) complexity",
      "recommendation": "Use hash map for O(n) solution",
      "impact": "High - affects scalability"
    }
  ],
  "optimizations": [
    {
      "category": "Caching",
      "description": "API responses can be cached",
      "expectedImprovement": "50% reduction in API calls"
    }
  ]
}
`;
````

## Implementation

### Main Analysis Service
````javascript
// services/analyzerService.js
import claudeService from './claudeService.js';
import githubService from './githubService.js';
import cacheService from './cacheService.js';

class AnalyzerService {
  async analyzeRepository(repoUrl, userApiKey = null) {
    // Check cache
    const cached = await cacheService.getAnalysisCache(repoUrl);
    if (cached) {
      return cached;
    }

    // Parse repo URL
    const { owner, repo } = this.parseGitHubUrl(repoUrl);

    // Fetch repository files
    const files = await githubService.getRepoTree(owner, repo);
    const codeFiles = this.filterCodeFiles(files);

    // Analyze files
    const analyses = await this.analyzeFiles(codeFiles, owner, repo, userApiKey);

    // Generate report
    const report = this.generateReport(analyses);

    // Cache result
    await cacheService.cacheAnalysis(repoUrl, report);

    return report;
  }

  filterCodeFiles(files) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go'];
    return files.filter(file => 
      codeExtensions.some(ext => file.path.endsWith(ext)) &&
      !file.path.includes('node_modules') &&
      !file.path.includes('dist') &&
      !file.path.includes('build')
    );
  }

  async analyzeFiles(files, owner, repo, userApiKey) {
    const analyses = [];
    
    // Limit to prevent timeout
    const maxFiles = 20;
    const filesToAnalyze = files.slice(0, maxFiles);

    for (const file of filesToAnalyze) {
      try {
        const content = await githubService.getFileContent(owner, repo, file.path);
        
        // Quality analysis
        const qualityResult = await this.analyzeQuality(content, userApiKey);
        
        // Security analysis
        const securityResult = await this.analyzeSecurity(content, userApiKey);
        
        // Performance analysis
        const performanceResult = await this.analyzePerformance(content, userApiKey);

        analyses.push({
          file: file.path,
          quality: qualityResult,
          security: securityResult,
          performance: performanceResult,
        });

        // Rate limiting delay
        await this.sleep(1000);
      } catch (error) {
        console.error(`Failed to analyze ${file.path}:`, error.message);
      }
    }

    return analyses;
  }

  async analyzeQuality(code, userApiKey) {
    const prompt = qualityAnalysisPrompt(code);
    const response = await claudeService.analyze(prompt, userApiKey);
    return this.parseJSON(response);
  }

  async analyzeSecurity(code, userApiKey) {
    const prompt = securityAnalysisPrompt(code);
    const response = await claudeService.analyze(prompt, userApiKey);
    return this.parseJSON(response);
  }

  async analyzePerformance(code, userApiKey) {
    const prompt = performanceAnalysisPrompt(code);
    const response = await claudeService.analyze(prompt, userApiKey);
    return this.parseJSON(response);
  }

  generateReport(analyses) {
    return {
      summary: {
        filesAnalyzed: analyses.length,
        overallQuality: this.calculateAverageScore(analyses, 'quality'),
        securityRisk: this.determineOverallRisk(analyses),
        performanceGrade: this.calculateAverageGrade(analyses),
      },
      quality: this.aggregateQuality(analyses),
      security: this.aggregateSecurity(analyses),
      performance: this.aggregatePerformance(analyses),
      recommendations: this.generateRecommendations(analyses),
    };
  }

  calculateAverageScore(analyses, category) {
    const scores = analyses.map(a => a[category].overall || a[category].score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  determineOverallRisk(analyses) {
    const risks = analyses.map(a => a.security.riskLevel);
    if (risks.includes('critical')) return 'critical';
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }

  calculateAverageGrade(analyses) {
    const gradeValues = { A: 5, B: 4, C: 3, D: 2, F: 1 };
    const grades = analyses.map(a => gradeValues[a.performance.grade]);
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    
    if (avg >= 4.5) return 'A';
    if (avg >= 3.5) return 'B';
    if (avg >= 2.5) return 'C';
    if (avg >= 1.5) return 'D';
    return 'F';
  }

  aggregateQuality(analyses) {
    const allIssues = analyses.flatMap(a => 
      a.quality.structure.issues.concat(
        a.quality.naming.issues,
        a.quality.errorHandling.issues,
        a.quality.documentation.issues,
        a.quality.testing.issues
      )
    );

    return {
      score: this.calculateAverageScore(analyses, 'quality'),
      issueCount: allIssues.length,
      topIssues: allIssues.slice(0, 10),
      byCategory: {
        structure: this.averageCategoryScore(analyses, 'quality', 'structure'),
        naming: this.averageCategoryScore(analyses, 'quality', 'naming'),
        errorHandling: this.averageCategoryScore(analyses, 'quality', 'errorHandling'),
        documentation: this.averageCategoryScore(analyses, 'quality', 'documentation'),
        testing: this.averageCategoryScore(analyses, 'quality', 'testing'),
      },
    };
  }

  aggregateSecurity(analyses) {
    const allVulnerabilities = analyses.flatMap(a => a.security.vulnerabilities);
    
    return {
      riskLevel: this.determineOverallRisk(analyses),
      vulnerabilityCount: allVulnerabilities.length,
      bySeverity: {
        critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
        high: allVulnerabilities.filter(v => v.severity === 'high').length,
        medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
        low: allVulnerabilities.filter(v => v.severity === 'low').length,
      },
      topVulnerabilities: allVulnerabilities.slice(0, 10),
    };
  }

  aggregatePerformance(analyses) {
    const allIssues = analyses.flatMap(a => a.performance.issues);
    
    return {
      grade: this.calculateAverageGrade(analyses),
      issueCount: allIssues.length,
      topIssues: allIssues.slice(0, 10),
      optimizations: analyses.flatMap(a => a.performance.optimizations || []),
    };
  }

  generateRecommendations(analyses) {
    const recommendations = [];

    // Quality recommendations
    const avgQuality = this.calculateAverageScore(analyses, 'quality');
    if (avgQuality < 70) {
      recommendations.push({
        priority: 'high',
        category: 'quality',
        title: 'Improve Code Quality',
        description: 'Overall code quality score is below 70. Focus on structure and documentation.',
        effort: 'medium',
      });
    }

    // Security recommendations
    const riskLevel = this.determineOverallRisk(analyses);
    if (['high', 'critical'].includes(riskLevel)) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Address Security Vulnerabilities',
        description: 'Critical security issues found. Immediate action required.',
        effort: 'high',
      });
    }

    // Performance recommendations
    const perfGrade = this.calculateAverageGrade(analyses);
    if (['D', 'F'].includes(perfGrade)) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize Performance',
        description: 'Significant performance issues detected. Review algorithm complexity.',
        effort: 'medium',
      });
    }

    return recommendations;
  }

  parseJSON(text) {
    try {
      // Extract JSON from potential markdown or text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${error.message}`);
    }
  }

  parseGitHubUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }

  averageCategoryScore(analyses, mainCategory, subCategory) {
    const scores = analyses.map(a => a[mainCategory][subCategory].score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AnalyzerService();
````

## Score Calculations

### Overall Quality Score
````javascript
Quality Score = (
  Structure * 0.25 +
  Naming * 0.20 +
  Error Handling * 0.20 +
  Documentation * 0.15 +
  Testing * 0.20
)
````

### Security Risk Level
````javascript
Critical: Any critical vulnerability OR 3+ high vulnerabilities
High: 2+ high vulnerabilities OR 5+ medium
Medium: 1 high OR 3+ medium OR 10+ low
Low: <3 medium AND <10 low
````

### Performance Grade
````javascript
A: 90-100 (Excellent)
B: 80-89  (Good)
C: 70-79  (Fair)
D: 60-69  (Poor)
F: 0-59   (Critical)
````

## Error Handling
````javascript
try {
  const analysis = await analyzerService.analyzeRepository(repoUrl);
} catch (error) {
  if (error.message.includes('not found')) {
    // Repository not found
    return { error: 'Repository not found', code: 'REPO_NOT_FOUND' };
  }
  
  if (error.message.includes('Rate limit')) {
    // Claude API rate limit
    return { error: 'API rate limit exceeded', code: 'RATE_LIMIT' };
  }
  
  if (error.message.includes('timeout')) {
    // Analysis timeout
    return { error: 'Analysis timeout', code: 'TIMEOUT' };
  }
  
  // Unknown error
  return { error: 'Analysis failed', code: 'UNKNOWN' };
}
````

## Best Practices

1. **Cache Results**: Cache analysis for 24 hours
2. **Rate Limiting**: Wait 1s between Claude API calls
3. **File Limits**: Analyze max 20 files to prevent timeout
4. **Error Handling**: Graceful degradation for failed files
5. **Timeouts**: 30s timeout per file analysis
6. **Validation**: Validate JSON responses from Claude
7. **Logging**: Log all analysis requests and failures