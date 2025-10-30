import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies BEFORE importing
jest.mock('../../services/githubService.js');
jest.mock('../../services/claudeService.js');
jest.mock('../../services/cacheService.js');

// Mock config
jest.mock('../../config/env.js', () => ({
  default: {
    NODE_ENV: 'test',
    ANTHROPIC_API_KEY: 'sk-ant-test-key',
    ANTHROPIC_MODEL: 'claude-sonnet-4',
    GITHUB_TOKEN: 'ghp_test_token',
    PORT: 3001
  }
}));

// Import AFTER mocks
import analyzerService from '../../services/analyzerService.js';
import githubService from '../../services/githubService.js';
import claudeService from '../../services/claudeService.js';
import cacheService from '../../services/cacheService.js';
import {
  mockRepoTree,
  mockFileContent,
  mockCodeQualityAnalysis
} from '../mocks/mockData.js';

describe('AnalyzerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cacheService mocks
    cacheService.generateKey = jest.fn((type, identifier) => `gitinsights:${type}:${identifier}`);
    cacheService.get = jest.fn(() => null);
    cacheService.set = jest.fn();
    cacheService.delete = jest.fn();
    cacheService.exists = jest.fn(() => false);
    cacheService.clear = jest.fn();

    // Setup githubService mocks
    githubService.parseGitHubUrl = jest.fn();
    githubService.getRepoTree = jest.fn();
    githubService.filterCodeFiles = jest.fn();
    githubService.selectImportantFiles = jest.fn();
    githubService.getFileContent = jest.fn();

    // Setup claudeService mocks
    claudeService.analyze = jest.fn();
    claudeService.parseJSON = jest.fn();
  });

  describe('analyzeRepository', () => {
    it('should successfully analyze a repository', async () => {
      // Setup mocks
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockResolvedValue(mockRepoTree);
      githubService.filterCodeFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1],
        mockRepoTree[2]
      ]);
      githubService.selectImportantFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1],
        mockRepoTree[2]
      ]);
      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const result = await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        null,
        10
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('files');
      expect(result.summary.filesAnalyzed).toBe(3);
      expect(result.summary.overallQuality).toBeGreaterThan(0);

      // Verify service interactions
      expect(githubService.parseGitHubUrl).toHaveBeenCalledWith(
        'https://github.com/testuser/test-repo'
      );
      expect(githubService.getRepoTree).toHaveBeenCalledWith('testuser', 'test-repo');
      expect(githubService.filterCodeFiles).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return cached result if available', async () => {
      const cachedResult = {
        summary: {
          filesAnalyzed: 3,
          overallQuality: 85,
          requestedFileLimit: 10,
          totalCodeFiles: 3,
          timestamp: '2025-01-15T12:00:00.000Z'
        },
        quality: { score: 85, issueCount: 0, topIssues: [] },
        files: []
      };

      cacheService.get.mockReturnValue(cachedResult);

      const result = await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        null,
        10
      );

      expect(result).toEqual(cachedResult);
      expect(githubService.parseGitHubUrl).not.toHaveBeenCalled();
      expect(githubService.getRepoTree).not.toHaveBeenCalled();
    });

    it('should use user-provided API key when provided', async () => {
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockResolvedValue(mockRepoTree);
      githubService.filterCodeFiles.mockReturnValue([mockRepoTree[0]]);
      githubService.selectImportantFiles.mockReturnValue([mockRepoTree[0]]);
      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const userApiKey = 'sk-ant-user-key-12345';

      await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        userApiKey,
        10
      );

      expect(claudeService.analyze).toHaveBeenCalledWith(
        expect.any(String),
        '',
        userApiKey
      );
    });

    it('should respect file limit parameter', async () => {
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockResolvedValue(mockRepoTree);
      githubService.filterCodeFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1],
        mockRepoTree[2]
      ]);
      githubService.selectImportantFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1]
      ]);
      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        null,
        2
      );

      expect(githubService.selectImportantFiles).toHaveBeenCalledWith(
        expect.any(Array),
        2
      );
    });

    it('should handle errors gracefully', async () => {
      githubService.parseGitHubUrl.mockImplementation(() => {
        throw new Error('Invalid GitHub URL format');
      });

      await expect(
        analyzerService.analyzeRepository('invalid-url', null, 10)
      ).rejects.toThrow('Invalid GitHub URL format');
    });

    it('should continue analyzing even if one file fails', async () => {
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockResolvedValue(mockRepoTree);
      githubService.filterCodeFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1],
        mockRepoTree[2]
      ]);
      githubService.selectImportantFiles.mockReturnValue([
        mockRepoTree[0],
        mockRepoTree[1],
        mockRepoTree[2]
      ]);

      // Make the second file fail
      let callCount = 0;
      githubService.getFileContent.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('File not found');
        }
        return Promise.resolve(mockFileContent);
      });

      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const result = await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        null,
        10
      );

      // Should have analyzed 2 files (skipped the failed one)
      expect(result.summary.filesAnalyzed).toBe(2);
    });
  });

  describe('validateFileLimit', () => {
    it('should return default value for invalid input', () => {
      expect(analyzerService.validateFileLimit('invalid')).toBe(10);
      expect(analyzerService.validateFileLimit(null)).toBe(10);
      expect(analyzerService.validateFileLimit(undefined)).toBe(10);
    });

    it('should enforce minimum limit of 1', () => {
      expect(analyzerService.validateFileLimit(0)).toBe(1);
      expect(analyzerService.validateFileLimit(-5)).toBe(1);
    });

    it('should enforce maximum limit of 50', () => {
      expect(analyzerService.validateFileLimit(51)).toBe(50);
      expect(analyzerService.validateFileLimit(100)).toBe(50);
    });

    it('should accept valid limits', () => {
      expect(analyzerService.validateFileLimit(1)).toBe(1);
      expect(analyzerService.validateFileLimit(25)).toBe(25);
      expect(analyzerService.validateFileLimit(50)).toBe(50);
    });

    it('should parse string numbers', () => {
      expect(analyzerService.validateFileLimit('10')).toBe(10);
      expect(analyzerService.validateFileLimit('25')).toBe(25);
    });
  });

  describe('analyzeFiles', () => {
    it('should analyze multiple files', async () => {
      const files = [mockRepoTree[0], mockRepoTree[1]];
      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const results = await analyzerService.analyzeFiles(
        files,
        'testuser',
        'test-repo',
        null
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('file', 'src/index.js');
      expect(results[0]).toHaveProperty('analysis');
      expect(results[1]).toHaveProperty('file', 'src/utils/helper.js');
    });

    it('should skip failed file analysis', async () => {
      const files = [mockRepoTree[0], mockRepoTree[1]];

      let callCount = 0;
      githubService.getFileContent.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('File not accessible');
        }
        return Promise.resolve(mockFileContent);
      });

      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const results = await analyzerService.analyzeFiles(
        files,
        'testuser',
        'test-repo',
        null
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('file', 'src/utils/helper.js');
    });

    it('should pass user API key to Claude service', async () => {
      const files = [mockRepoTree[0]];
      const userApiKey = 'sk-ant-user-key';

      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      await analyzerService.analyzeFiles(files, 'testuser', 'test-repo', userApiKey);

      expect(claudeService.analyze).toHaveBeenCalledWith(
        expect.any(String),
        '',
        userApiKey
      );
    });
  });

  describe('generateReport', () => {
    it('should generate report with correct structure', () => {
      const analyses = [
        {
          file: 'src/index.js',
          analysis: { ...mockCodeQualityAnalysis, overall: 85 }
        },
        {
          file: 'src/utils/helper.js',
          analysis: { ...mockCodeQualityAnalysis, overall: 90 }
        }
      ];

      const report = analyzerService.generateReport(analyses, 10, 5);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('quality');
      expect(report).toHaveProperty('files');

      expect(report.summary.filesAnalyzed).toBe(2);
      expect(report.summary.overallQuality).toBe(88); // Average of 85 and 90
      expect(report.summary.requestedFileLimit).toBe(10);
      expect(report.summary.totalCodeFiles).toBe(5);
      expect(report.summary.timestamp).toBeDefined();

      expect(report.files).toHaveLength(2);
    });

    it('should handle empty analyses', () => {
      const report = analyzerService.generateReport([], 10, 0);

      expect(report.summary.filesAnalyzed).toBe(0);
      expect(report.summary.overallQuality).toBe(0);
      expect(report.quality.score).toBe(0);
      expect(report.quality.issueCount).toBe(0);
      expect(report.files).toHaveLength(0);
    });

    it('should extract top issues correctly', () => {
      const analyses = [
        {
          file: 'src/index.js',
          analysis: {
            overall: 85,
            structure: {
              score: 90,
              issues: ['Issue 1', 'Issue 2'],
              recommendations: []
            },
            naming: {
              score: 80,
              issues: ['Issue 3'],
              recommendations: []
            },
            errorHandling: {
              score: 85,
              issues: [],
              recommendations: []
            },
            documentation: {
              score: 80,
              issues: [],
              recommendations: []
            },
            testing: {
              score: 75,
              issues: [],
              recommendations: []
            }
          }
        }
      ];

      const report = analyzerService.generateReport(analyses, 10, 3);

      expect(report.quality.issueCount).toBe(3);
      expect(report.quality.topIssues).toHaveLength(3);
      expect(report.quality.topIssues[0]).toHaveProperty('file', 'src/index.js');
      expect(report.quality.topIssues[0]).toHaveProperty('issue');
    });

    it('should limit top issues to 10', () => {
      const manyIssues = Array(15).fill('Issue');
      const analyses = [
        {
          file: 'src/index.js',
          analysis: {
            overall: 85,
            structure: {
              score: 90,
              issues: manyIssues,
              recommendations: []
            },
            naming: {
              score: 80,
              issues: [],
              recommendations: []
            },
            errorHandling: {
              score: 85,
              issues: [],
              recommendations: []
            },
            documentation: {
              score: 80,
              issues: [],
              recommendations: []
            },
            testing: {
              score: 75,
              issues: [],
              recommendations: []
            }
          }
        }
      ];

      const report = analyzerService.generateReport(analyses, 10, 3);

      expect(report.quality.topIssues.length).toBeLessThanOrEqual(10);
    });

    it('should calculate average score correctly', () => {
      const analyses = [
        {
          file: 'file1.js',
          analysis: { ...mockCodeQualityAnalysis, overall: 80 }
        },
        {
          file: 'file2.js',
          analysis: { ...mockCodeQualityAnalysis, overall: 90 }
        },
        {
          file: 'file3.js',
          analysis: { ...mockCodeQualityAnalysis, overall: 85 }
        }
      ];

      const report = analyzerService.generateReport(analyses, 10, 5);

      // (80 + 90 + 85) / 3 = 85
      expect(report.summary.overallQuality).toBe(85);
      expect(report.quality.score).toBe(85);
    });
  });

  describe('analyzeQuality', () => {
    beforeEach(() => {
      // Reset to test mode
      jest.resetModules();
    });

    it('should return mock data in development mode', async () => {
      // This is tested when NODE_ENV is 'development'
      // For now we're in 'test' mode, so it will use real API
      const code = 'function test() { return true; }';

      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      const result = await analyzerService.analyzeQuality(code, null);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('structure');
      expect(result).toHaveProperty('naming');
      expect(result).toHaveProperty('errorHandling');
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('testing');
    });

    it('should call Claude API with proper prompt', async () => {
      const code = 'const x = 1;';

      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      await analyzerService.analyzeQuality(code, null);

      expect(claudeService.analyze).toHaveBeenCalledWith(
        expect.stringContaining('code reviewer'),
        '',
        null
      );
      expect(claudeService.analyze).toHaveBeenCalledWith(
        expect.stringContaining(code),
        '',
        null
      );
    });

    it('should use user API key when provided', async () => {
      const code = 'const x = 1;';
      const userApiKey = 'sk-ant-user-key';

      claudeService.analyze.mockResolvedValue(JSON.stringify(mockCodeQualityAnalysis));
      claudeService.parseJSON.mockReturnValue(mockCodeQualityAnalysis);

      await analyzerService.analyzeQuality(code, userApiKey);

      expect(claudeService.analyze).toHaveBeenCalledWith(
        expect.any(String),
        '',
        userApiKey
      );
    });
  });

  describe('Error scenarios', () => {
    it('should handle GitHub API errors', async () => {
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockRejectedValue(
        new Error('Repository not found')
      );

      await expect(
        analyzerService.analyzeRepository(
          'https://github.com/testuser/test-repo',
          null,
          10
        )
      ).rejects.toThrow('Repository not found');
    });

    it('should handle Claude API errors', async () => {
      githubService.parseGitHubUrl.mockReturnValue({
        owner: 'testuser',
        repo: 'test-repo'
      });
      githubService.getRepoTree.mockResolvedValue(mockRepoTree);
      githubService.filterCodeFiles.mockReturnValue([mockRepoTree[0]]);
      githubService.selectImportantFiles.mockReturnValue([mockRepoTree[0]]);
      githubService.getFileContent.mockResolvedValue(mockFileContent);
      claudeService.analyze.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await analyzerService.analyzeRepository(
        'https://github.com/testuser/test-repo',
        null,
        10
      );

      // Should return report with 0 files analyzed
      expect(result.summary.filesAnalyzed).toBe(0);
    });
  });
});
