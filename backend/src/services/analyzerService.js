import githubService from './githubService.js';
import claudeService from './claudeService.js';
import cacheService from './cacheService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

class AnalyzerService {
  /**
   * Analyze a GitHub repository with optional progress tracking
   * @param {string} repoUrl - GitHub repository URL
   * @param {string|null} userApiKey - User's Anthropic API key
   * @param {number} fileLimit - Maximum number of files to analyze
   * @param {function|null} progressCallback - Optional callback for progress updates
   * @param {Array|null} filePaths - Optional array of specific file paths to analyze
   * @returns {Promise<Object>} Analysis report
   */
  async analyzeRepository(repoUrl, userApiKey = null, fileLimit = 10, progressCallback = null, filePaths = null) {
    // Validate fileLimit
    const validatedLimit = this.validateFileLimit(fileLimit);

    // Emit progress: validation started
    if (progressCallback) {
      progressCallback({
        stage: 'validation',
        message: 'Validating repository URL',
        progress: 5
      });
    }

    const cacheKey = cacheService.generateKey('analysis', `${repoUrl}_${validatedLimit}`);
    const cached = cacheService.get(cacheKey);

    if (cached) {
      // Emit progress: returning cached result
      if (progressCallback) {
        progressCallback({
          stage: 'cached',
          message: 'Returning cached analysis',
          progress: 100
        });
      }
      return cached;
    }

    // Emit progress: parsing URL
    if (progressCallback) {
      progressCallback({
        stage: 'parsing',
        message: 'Parsing repository URL',
        progress: 10
      });
    }

    const { owner, repo } = githubService.parseGitHubUrl(repoUrl);

    // Emit progress: fetching file tree
    if (progressCallback) {
      progressCallback({
        stage: 'fetching_tree',
        message: 'Fetching repository file tree',
        progress: 15
      });
    }

    const files = await githubService.getRepoTree(owner, repo);
    const codeFiles = githubService.filterCodeFiles(files);
    const totalCodeFiles = codeFiles.length;

    // Emit progress: files fetched
    if (progressCallback) {
      progressCallback({
        stage: 'tree_fetched',
        message: `Found ${totalCodeFiles} code files`,
        progress: 25,
        data: { totalCodeFiles }
      });
    }

    // If specific file paths are provided, use them; otherwise select important files
    let limitedFiles;
    if (filePaths && filePaths.length > 0) {
      // Filter the code files to only include the ones specified by the user
      limitedFiles = codeFiles.filter(file => filePaths.includes(file.path));

      // If some paths weren't found, log a warning
      if (limitedFiles.length < filePaths.length) {
        const foundPaths = limitedFiles.map(f => f.path);
        const notFound = filePaths.filter(p => !foundPaths.includes(p));
        logger.warn('Some requested files not found', { notFound });
      }
    } else {
      limitedFiles = githubService.selectImportantFiles(codeFiles, validatedLimit);
    }

    // Emit progress: starting analysis
    if (progressCallback) {
      progressCallback({
        stage: 'analysis_starting',
        message: `Starting analysis of ${limitedFiles.length} files`,
        progress: 30,
        data: { filesToAnalyze: limitedFiles.length }
      });
    }

    const analyses = await this.analyzeFiles(limitedFiles, owner, repo, userApiKey, progressCallback);

    // Emit progress: generating report
    if (progressCallback) {
      progressCallback({
        stage: 'generating_report',
        message: 'Generating analysis report',
        progress: 95
      });
    }

    const report = this.generateReport(analyses, validatedLimit, totalCodeFiles);

    cacheService.set(cacheKey, report, 86400);

    return report;
  }

  validateFileLimit(fileLimit) {
    const limit = parseInt(fileLimit, 10);

    if (isNaN(limit)) {
      return 10; // Default
    }

    if (limit < 1) {
      return 1; // Minimum
    }

    if (limit > 50) {
      return 50; // Maximum
    }

    return limit;
  }

  /**
   * Analyze multiple files with progress tracking
   * @param {Array} files - Files to analyze
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string|null} userApiKey - User's Anthropic API key
   * @param {function|null} progressCallback - Optional callback for progress updates
   * @returns {Promise<Array>} Analysis results
   */
  async analyzeFiles(files, owner, repo, userApiKey, progressCallback = null) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const current = i + 1;

      try {
        // Emit progress: analyzing specific file
        if (progressCallback) {
          const baseProgress = 30; // Starting point after tree fetch
          const analysisRange = 65; // Progress range for analysis (30-95)
          const fileProgress = baseProgress + (analysisRange * current / total);

          progressCallback({
            stage: 'analyzing_file',
            message: `Analyzing ${file.path}`,
            progress: Math.round(fileProgress),
            current,
            total,
            data: { fileName: file.path }
          });
        }

        const content = await githubService.getFileContent(owner, repo, file.path);
        const analysis = await this.analyzeQuality(content, userApiKey);

        results.push({
          file: file.path,
          analysis
        });

        await this.sleep(1000);
      } catch (error) {
        logger.warn('Failed to analyze file', {
          file: file.path,
          error: error.message,
          owner,
          repo
        });

        // Emit progress: file analysis failed
        if (progressCallback) {
          progressCallback({
            stage: 'file_error',
            message: `Failed to analyze ${file.path}`,
            progress: Math.round(30 + (65 * current / total)),
            current,
            total,
            data: { fileName: file.path, error: error.message }
          });
        }

        continue;
      }
    }

    return results;
  }

  async analyzeQuality(code, userApiKey) {
    // Demo mode: return mock data if NODE_ENV is development and no credits
    const isDemoMode = config.NODE_ENV === 'development';

    if (isDemoMode) {
      // Generate mock analysis based on code length and complexity
      const lines = code.split('\n').length;
      const hasComments = code.includes('//') || code.includes('/*');
      const hasErrorHandling = code.includes('try') || code.includes('catch');
      const hasFunctions = code.includes('function') || code.includes('=>');

      return {
        overall: Math.floor(Math.random() * 20) + 70, // 70-90
        structure: {
          score: hasFunctions ? 85 : 70,
          issues: lines > 100 ? ["File is quite large, consider breaking into smaller modules"] : [],
          recommendations: ["Consider using more modular design patterns"]
        },
        naming: {
          score: 80,
          issues: [],
          recommendations: ["Use more descriptive variable names"]
        },
        errorHandling: {
          score: hasErrorHandling ? 85 : 60,
          issues: hasErrorHandling ? [] : ["Missing error handling"],
          recommendations: ["Add try-catch blocks for error handling"]
        },
        documentation: {
          score: hasComments ? 75 : 50,
          issues: hasComments ? [] : ["Missing code documentation"],
          recommendations: ["Add JSDoc comments for functions"]
        },
        testing: {
          score: 65,
          issues: ["No tests found in this file"],
          recommendations: ["Add unit tests", "Consider using Jest or Vitest"]
        }
      };
    }

    // Real API mode
    const prompt = `You are a senior code reviewer. Analyze this code and provide quality assessment. Evaluate (0-100 each):
1. Structure & Organization
2. Naming & Readability
3. Error Handling
4. Documentation
5. Testing

Return ONLY valid JSON in this exact format:
{
  "overall": 85,
  "structure": {
    "score": 90,
    "issues": ["issue1", "issue2"],
    "recommendations": ["rec1", "rec2"]
  },
  "naming": {
    "score": 85,
    "issues": [],
    "recommendations": []
  },
  "errorHandling": {
    "score": 75,
    "issues": [],
    "recommendations": []
  },
  "documentation": {
    "score": 80,
    "issues": [],
    "recommendations": []
  },
  "testing": {
    "score": 90,
    "issues": [],
    "recommendations": []
  }
}

Code to analyze:
${code}`;

    const response = await claudeService.analyze(prompt, '', userApiKey);
    return claudeService.parseJSON(response);
  }

  generateReport(analyses, requestedFileLimit = 10, totalCodeFiles = 0) {
    if (analyses.length === 0) {
      return {
        summary: {
          filesAnalyzed: 0,
          overallQuality: 0,
          requestedFileLimit,
          totalCodeFiles,
          timestamp: new Date().toISOString()
        },
        quality: {
          score: 0,
          issueCount: 0,
          topIssues: []
        },
        files: []
      };
    }

    const scores = analyses.map(a => a.analysis.overall);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const allIssues = analyses.flatMap(a => {
      const analysis = a.analysis;
      const fileName = a.file;

      return Object.values(analysis)
        .flatMap(v => {
          if (typeof v === 'object' && v !== null && Array.isArray(v.issues)) {
            // Map each issue to an object with file reference
            return v.issues.map(issue => ({
              file: fileName,
              issue: issue
            }));
          }
          return [];
        });
    });

    return {
      summary: {
        filesAnalyzed: analyses.length,
        overallQuality: avgScore,
        requestedFileLimit,
        totalCodeFiles,
        timestamp: new Date().toISOString()
      },
      quality: {
        score: avgScore,
        issueCount: allIssues.length,
        topIssues: allIssues.slice(0, 10)
      },
      files: analyses.map(a => ({
        file: a.file,
        score: a.analysis.overall
      }))
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AnalyzerService();
