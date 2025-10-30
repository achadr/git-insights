import githubService from './githubService.js';
import claudeService from './claudeService.js';
import cacheService from './cacheService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

class AnalyzerService {
  async analyzeRepository(repoUrl, userApiKey = null, fileLimit = 10) {
    // Validate fileLimit
    const validatedLimit = this.validateFileLimit(fileLimit);

    const cacheKey = cacheService.generateKey('analysis', `${repoUrl}_${validatedLimit}`);
    const cached = cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const { owner, repo } = githubService.parseGitHubUrl(repoUrl);
    const files = await githubService.getRepoTree(owner, repo);
    const codeFiles = githubService.filterCodeFiles(files);
    const totalCodeFiles = codeFiles.length;
    const limitedFiles = githubService.selectImportantFiles(codeFiles, validatedLimit);

    const analyses = await this.analyzeFiles(limitedFiles, owner, repo, userApiKey);
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

  async analyzeFiles(files, owner, repo, userApiKey) {
    const results = [];

    for (const file of files) {
      try {
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
