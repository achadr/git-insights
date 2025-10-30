import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import githubService from '../../services/githubService.js';
import { Octokit } from '@octokit/rest';
import { mockGitHubRepo, mockRepoTree } from '../mocks/mockData.js';

// Mock config
jest.mock('../../config/env.js', () => ({
  default: {
    GITHUB_TOKEN: 'ghp_test_token_12345'
  }
}));

// Setup mock Octokit instance
const mockOctokit = {
  repos: {
    get: jest.fn(),
    getContent: jest.fn()
  },
  git: {
    getRef: jest.fn(),
    getTree: jest.fn()
  },
  rateLimit: {
    get: jest.fn()
  }
};

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit)
}));

describe('GitHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRepository', () => {
    it('should successfully fetch repository information', async () => {
      mockOctokit.repos.get.mockResolvedValue({
        data: {
          name: 'test-repo',
          full_name: 'testuser/test-repo',
          description: 'A test repository',
          html_url: 'https://github.com/testuser/test-repo',
          language: 'JavaScript',
          stargazers_count: 42,
          forks_count: 10,
          size: 1024,
          default_branch: 'main',
          topics: ['testing', 'javascript']
        }
      });

      const result = await githubService.getRepository('testuser', 'test-repo');

      expect(result).toEqual({
        name: 'test-repo',
        fullName: 'testuser/test-repo',
        description: 'A test repository',
        url: 'https://github.com/testuser/test-repo',
        language: 'JavaScript',
        stars: 42,
        forks: 10,
        size: 1024,
        defaultBranch: 'main',
        topics: ['testing', 'javascript']
      });

      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should handle repository not found (404)', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;

      mockOctokit.repos.get.mockRejectedValue(notFoundError);

      await expect(
        githubService.getRepository('nonexistent', 'repo')
      ).rejects.toThrow('Repository not found');
    });

    it('should handle rate limit exceeded (403)', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 403;

      mockOctokit.repos.get.mockRejectedValue(rateLimitError);

      await expect(
        githubService.getRepository('testuser', 'test-repo')
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network error');

      mockOctokit.repos.get.mockRejectedValue(genericError);

      await expect(
        githubService.getRepository('testuser', 'test-repo')
      ).rejects.toThrow('Network error');
    });

    it('should handle repositories with null description', async () => {
      mockOctokit.repos.get.mockResolvedValue({
        data: {
          name: 'test-repo',
          full_name: 'testuser/test-repo',
          description: null,
          html_url: 'https://github.com/testuser/test-repo',
          language: 'JavaScript',
          stargazers_count: 0,
          forks_count: 0,
          size: 100,
          default_branch: 'main',
          topics: []
        }
      });

      const result = await githubService.getRepository('testuser', 'test-repo');

      expect(result.description).toBeNull();
    });
  });

  describe('getRepoTree', () => {
    it('should fetch repository tree for main branch', async () => {
      mockOctokit.git.getRef.mockResolvedValue({
        data: {
          object: {
            sha: 'abc123def456'
          }
        }
      });

      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          tree: [
            { path: 'src/index.js', type: 'blob', size: 1024, sha: 'sha1' },
            { path: 'README.md', type: 'blob', size: 512, sha: 'sha2' },
            { path: 'src', type: 'tree', sha: 'sha3' }
          ]
        }
      });

      const result = await githubService.getRepoTree('testuser', 'test-repo');

      expect(result).toHaveLength(2); // Only blobs, not trees
      expect(result[0]).toEqual({
        path: 'src/index.js',
        type: 'blob',
        size: 1024,
        sha: 'sha1'
      });

      expect(mockOctokit.git.getRef).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        ref: 'heads/main'
      });

      expect(mockOctokit.git.getTree).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        tree_sha: 'abc123def456',
        recursive: 'true'
      });
    });

    it('should fallback to master branch if main does not exist', async () => {
      // First call to getRef (for main) throws 404
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;

      mockOctokit.git.getRef
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce({
          data: {
            object: {
              sha: 'master123'
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            object: {
              sha: 'master123'
            }
          }
        });

      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          tree: [
            { path: 'index.js', type: 'blob', size: 1024, sha: 'sha1' }
          ]
        }
      });

      const result = await githubService.getRepoTree('testuser', 'old-repo');

      expect(result).toHaveLength(1);
      expect(mockOctokit.git.getRef).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'old-repo',
        ref: 'heads/main'
      });
      expect(mockOctokit.git.getRef).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'old-repo',
        ref: 'heads/master'
      });
    });

    it('should throw error if neither main nor master exists', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;

      mockOctokit.git.getRef.mockRejectedValue(notFoundError);

      await expect(
        githubService.getRepoTree('testuser', 'test-repo')
      ).rejects.toThrow();
    });

    it('should filter out tree objects and return only blobs', async () => {
      mockOctokit.git.getRef.mockResolvedValue({
        data: {
          object: {
            sha: 'abc123'
          }
        }
      });

      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          tree: [
            { path: 'file1.js', type: 'blob', size: 100, sha: 'sha1' },
            { path: 'dir', type: 'tree', sha: 'sha2' },
            { path: 'file2.js', type: 'blob', size: 200, sha: 'sha3' },
            { path: 'subdir', type: 'tree', sha: 'sha4' },
            { path: 'file3.js', type: 'blob', size: 300, sha: 'sha5' }
          ]
        }
      });

      const result = await githubService.getRepoTree('testuser', 'test-repo');

      expect(result).toHaveLength(3);
      expect(result.every(item => item.type === 'blob')).toBe(true);
    });
  });

  describe('getFileContent', () => {
    it('should fetch and decode base64 file content', async () => {
      const content = 'console.log("Hello World");';
      const base64Content = Buffer.from(content).toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: base64Content,
          encoding: 'base64'
        }
      });

      const result = await githubService.getFileContent(
        'testuser',
        'test-repo',
        'src/index.js'
      );

      expect(result).toBe(content);
      expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        path: 'src/index.js'
      });
    });

    it('should handle plain text content', async () => {
      const content = 'Plain text content';

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: content,
          encoding: 'utf-8'
        }
      });

      const result = await githubService.getFileContent(
        'testuser',
        'test-repo',
        'README.md'
      );

      expect(result).toBe(content);
    });

    it('should handle file not found error', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;

      mockOctokit.repos.getContent.mockRejectedValue(notFoundError);

      await expect(
        githubService.getFileContent('testuser', 'test-repo', 'missing.js')
      ).rejects.toThrow();
    });

    it('should handle binary files encoded in base64', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      const base64Data = binaryData.toString('base64');

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: base64Data,
          encoding: 'base64'
        }
      });

      const result = await githubService.getFileContent(
        'testuser',
        'test-repo',
        'image.png'
      );

      expect(result).toBeTruthy();
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse full HTTPS GitHub URL', () => {
      const result = githubService.parseGitHubUrl(
        'https://github.com/testuser/test-repo'
      );

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should parse GitHub URL with .git extension', () => {
      const result = githubService.parseGitHubUrl(
        'https://github.com/testuser/test-repo.git'
      );

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should parse short format owner/repo', () => {
      const result = githubService.parseGitHubUrl('testuser/test-repo');

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should parse short format with .git extension', () => {
      const result = githubService.parseGitHubUrl('testuser/test-repo.git');

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should parse HTTP GitHub URL', () => {
      const result = githubService.parseGitHubUrl(
        'http://github.com/testuser/test-repo'
      );

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should parse www.github.com URL', () => {
      const result = githubService.parseGitHubUrl(
        'https://www.github.com/testuser/test-repo'
      );

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });

    it('should throw error for invalid URL format', () => {
      expect(() => {
        githubService.parseGitHubUrl('invalid-url');
      }).toThrow('Invalid GitHub URL format');
    });

    it('should throw error for non-GitHub URL', () => {
      expect(() => {
        githubService.parseGitHubUrl('https://gitlab.com/user/repo');
      }).toThrow('Invalid GitHub URL format');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        githubService.parseGitHubUrl('');
      }).toThrow('Invalid GitHub URL format');
    });

    it('should handle URLs with additional path segments', () => {
      const result = githubService.parseGitHubUrl(
        'https://github.com/testuser/test-repo/tree/main'
      );

      expect(result).toEqual({
        owner: 'testuser',
        repo: 'test-repo'
      });
    });
  });

  describe('filterCodeFiles', () => {
    it('should filter code files by extension', () => {
      const files = [
        { path: 'src/index.js', type: 'blob' },
        { path: 'src/app.jsx', type: 'blob' },
        { path: 'src/types.ts', type: 'blob' },
        { path: 'src/component.tsx', type: 'blob' },
        { path: 'main.py', type: 'blob' },
        { path: 'App.java', type: 'blob' },
        { path: 'main.go', type: 'blob' },
        { path: 'README.md', type: 'blob' },
        { path: 'package.json', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(7);
      expect(result.map(f => f.path)).toEqual([
        'src/index.js',
        'src/app.jsx',
        'src/types.ts',
        'src/component.tsx',
        'main.py',
        'App.java',
        'main.go'
      ]);
    });

    it('should exclude node_modules directory', () => {
      const files = [
        { path: 'src/index.js', type: 'blob' },
        { path: 'node_modules/package/index.js', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.js');
    });

    it('should exclude dist and build directories', () => {
      const files = [
        { path: 'src/index.js', type: 'blob' },
        { path: 'dist/bundle.js', type: 'blob' },
        { path: 'build/output.js', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.js');
    });

    it('should exclude .git directory', () => {
      const files = [
        { path: 'src/index.js', type: 'blob' },
        { path: '.git/config', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.js');
    });

    it('should exclude vendor and target directories', () => {
      const files = [
        { path: 'main.go', type: 'blob' },
        { path: 'vendor/package/file.go', type: 'blob' },
        { path: 'target/compiled.class', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('main.go');
    });

    it('should return empty array for no code files', () => {
      const files = [
        { path: 'README.md', type: 'blob' },
        { path: 'package.json', type: 'blob' },
        { path: 'LICENSE', type: 'blob' }
      ];

      const result = githubService.filterCodeFiles(files);

      expect(result).toHaveLength(0);
    });
  });

  describe('selectImportantFiles', () => {
    it('should prioritize entry point files', () => {
      const files = [
        { path: 'src/utils/helper.js', type: 'blob', size: 5000 },
        { path: 'src/index.js', type: 'blob', size: 1000 },
        { path: 'src/app.js', type: 'blob', size: 1000 }
      ];

      const result = githubService.selectImportantFiles(files, 2);

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('src/index.js');
      expect(result[1].path).toBe('src/app.js');
    });

    it('should exclude test files', () => {
      const files = [
        { path: 'src/index.js', type: 'blob', size: 1000 },
        { path: 'src/index.test.js', type: 'blob', size: 2000 },
        { path: 'src/__tests__/helper.js', type: 'blob', size: 1500 },
        { path: 'src/app.spec.js', type: 'blob', size: 1800 }
      ];

      const result = githubService.selectImportantFiles(files, 10);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.js');
    });

    it('should exclude config files', () => {
      const files = [
        { path: 'src/index.js', type: 'blob', size: 1000 },
        { path: 'webpack.config.js', type: 'blob', size: 2000 },
        { path: '.eslintrc.js', type: 'blob', size: 500 },
        { path: 'babel.config.ts', type: 'blob', size: 800 }
      ];

      const result = githubService.selectImportantFiles(files, 10);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/index.js');
    });

    it('should prioritize files in src directory', () => {
      const files = [
        { path: 'utils/helper.js', type: 'blob', size: 5000 },
        { path: 'src/app.js', type: 'blob', size: 1000 }
      ];

      const result = githubService.selectImportantFiles(files, 1);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/app.js');
    });

    it('should respect file limit', () => {
      const files = Array(20)
        .fill(null)
        .map((_, i) => ({
          path: `src/file${i}.js`,
          type: 'blob',
          size: 1000
        }));

      const result = githubService.selectImportantFiles(files, 5);

      expect(result).toHaveLength(5);
    });

    it('should prioritize larger files when other factors are equal', () => {
      const files = [
        { path: 'src/small.js', type: 'blob', size: 1000 },
        { path: 'src/large.js', type: 'blob', size: 10000 },
        { path: 'src/medium.js', type: 'blob', size: 5000 }
      ];

      const result = githubService.selectImportantFiles(files, 2);

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('src/large.js');
      expect(result[1].path).toBe('src/medium.js');
    });

    it('should handle empty file list', () => {
      const result = githubService.selectImportantFiles([], 10);

      expect(result).toHaveLength(0);
    });

    it('should return all files if limit is greater than file count', () => {
      const files = [
        { path: 'src/index.js', type: 'blob', size: 1000 },
        { path: 'src/app.js', type: 'blob', size: 1000 }
      ];

      const result = githubService.selectImportantFiles(files, 10);

      expect(result).toHaveLength(2);
    });
  });

  describe('checkRateLimit', () => {
    it('should return rate limit information', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;

      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          rate: {
            limit: 5000,
            remaining: 4999,
            reset: resetTime
          }
        }
      });

      const result = await githubService.checkRateLimit();

      expect(result).toEqual({
        limit: 5000,
        remaining: 4999,
        reset: new Date(resetTime * 1000)
      });
    });

    it('should handle rate limit check error', async () => {
      mockOctokit.rateLimit.get.mockRejectedValue(
        new Error('Failed to check rate limit')
      );

      await expect(githubService.checkRateLimit()).rejects.toThrow(
        'Failed to check rate limit'
      );
    });

    it('should return correct date object for reset time', async () => {
      const resetTime = 1704067200; // 2024-01-01 00:00:00 UTC

      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          rate: {
            limit: 5000,
            remaining: 100,
            reset: resetTime
          }
        }
      });

      const result = await githubService.checkRateLimit();

      expect(result.reset).toBeInstanceOf(Date);
      expect(result.reset.getTime()).toBe(resetTime * 1000);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete repository analysis workflow', async () => {
      // Parse URL
      const { owner, repo } = githubService.parseGitHubUrl(
        'https://github.com/testuser/test-repo'
      );

      // Get repository tree
      mockOctokit.git.getRef.mockResolvedValue({
        data: { object: { sha: 'abc123' } }
      });

      mockOctokit.git.getTree.mockResolvedValue({
        data: {
          tree: [
            { path: 'src/index.js', type: 'blob', size: 2000 },
            { path: 'src/app.js', type: 'blob', size: 3000 },
            { path: 'tests/index.test.js', type: 'blob', size: 1000 }
          ]
        }
      });

      const tree = await githubService.getRepoTree(owner, repo);

      // Filter code files
      const codeFiles = githubService.filterCodeFiles(tree);

      // Select important files
      const importantFiles = githubService.selectImportantFiles(codeFiles, 2);

      expect(owner).toBe('testuser');
      expect(repo).toBe('test-repo');
      expect(tree).toHaveLength(3);
      expect(codeFiles).toHaveLength(3);
      expect(importantFiles).toHaveLength(2);
    });
  });
});
