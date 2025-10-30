import { Octokit } from '@octokit/rest';
import config from '../config/env.js';
import { PathTraversalError, NotFoundError, ExternalServiceError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: config.GITHUB_TOKEN
    });

    // Maximum file size to fetch (10MB)
    this.MAX_FILE_SIZE = 10 * 1024 * 1024;
  }

  /**
   * Validate file path for security
   * Prevents path traversal attacks
   */
  validateFilePath(path) {
    if (!path || typeof path !== 'string') {
      throw new PathTraversalError(path);
    }

    // Check for path traversal patterns
    if (path.includes('..') || path.includes('//')) {
      logger.warn('Path traversal attempt detected', { path });
      throw new PathTraversalError(path);
    }

    // Path should not start with / (absolute paths)
    if (path.startsWith('/')) {
      logger.warn('Absolute path attempt detected', { path });
      throw new PathTraversalError(path);
    }

    // Check for null bytes
    if (path.includes('\0')) {
      logger.warn('Null byte in path detected', { path });
      throw new PathTraversalError(path);
    }

    // Check for encoded path traversal
    const decoded = decodeURIComponent(path);
    if (decoded.includes('..') || decoded.includes('//')) {
      logger.warn('Encoded path traversal attempt detected', { path, decoded });
      throw new PathTraversalError(path);
    }

    // Path length limit (prevent DoS)
    if (path.length > 1000) {
      logger.warn('Excessive path length detected', { path: path.substring(0, 100) });
      throw new PathTraversalError(path);
    }

    return true;
  }

  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });

      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        url: data.html_url,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        size: data.size,
        defaultBranch: data.default_branch,
        topics: data.topics
      };
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundError('Repository', `${owner}/${repo}`);
      }
      if (error.status === 403) {
        throw new ExternalServiceError('GitHub', 'API rate limit exceeded', error);
      }
      throw new ExternalServiceError('GitHub', error.message, error);
    }
  }

  async getRepoTree(owner, repo, branch = 'main') {
    try {
      let ref = 'heads/main';

      try {
        await this.octokit.git.getRef({ owner, repo, ref });
      } catch (error) {
        if (error.status === 404) {
          ref = 'heads/master';
          await this.octokit.git.getRef({ owner, repo, ref });
        } else {
          throw error;
        }
      }

      const { data: refData } = await this.octokit.git.getRef({ owner, repo, ref });
      const tree_sha = refData.object.sha;

      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha,
        recursive: 'true'
      });

      return data.tree.filter(item => item.type === 'blob');
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundError('Repository branch', ref);
      }
      throw new ExternalServiceError('GitHub', 'Failed to fetch repository tree', error);
    }
  }

  async getFileContent(owner, repo, path) {
    // Validate path for security (prevent path traversal)
    this.validateFilePath(path);

    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path });

      // Check if it's a file (not directory)
      if (Array.isArray(data)) {
        throw new NotFoundError('File', path);
      }

      // Check file size before fetching content
      if (data.size > this.MAX_FILE_SIZE) {
        logger.warn('File size exceeds limit', { path, size: data.size, limit: this.MAX_FILE_SIZE });
        throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Decode content
      if (data.encoding === 'base64') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      }

      return data.content || '';
    } catch (error) {
      if (error instanceof PathTraversalError) {
        throw error;
      }
      if (error.status === 404) {
        throw new NotFoundError('File', path);
      }
      if (error.status === 403) {
        throw new ExternalServiceError('GitHub', 'API rate limit exceeded or access forbidden', error);
      }
      throw new ExternalServiceError('GitHub', `Failed to fetch file: ${error.message}`, error);
    }
  }

  parseGitHubUrl(url) {
    let match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);

    if (!match) {
      match = url.match(/^([^\/]+)\/([^\/]+)$/);
    }

    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }

    let owner = match[1];
    let repo = match[2].replace(/\.git$/, '');

    return { owner, repo };
  }

  filterCodeFiles(files) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go'];
    const excludePaths = ['node_modules/', 'dist/', 'build/', '.git/', 'vendor/', 'target/'];

    return files.filter(file => {
      const hasCodeExtension = codeExtensions.some(ext => file.path.endsWith(ext));
      const isExcluded = excludePaths.some(excluded => file.path.includes(excluded));

      return hasCodeExtension && !isExcluded;
    });
  }

  selectImportantFiles(files, limit = 10) {
    // Filter out test and config files first
    const nonTestFiles = files.filter(file => {
      const path = file.path.toLowerCase();
      const filename = path.split('/').pop();

      // Check for test files
      if (path.includes('.test.') || path.includes('.spec.') ||
          path.includes('__tests__') || path.includes('/test/')) {
        return false;
      }

      // Check for config files (more comprehensive patterns)
      if (filename.match(/\.(config|rc)\.(js|ts|json)$/) ||
          filename.match(/^(\.eslintrc|\.babelrc|\.prettierrc|webpack\.config|rollup\.config|vite\.config|jest\.config)/)) {
        return false;
      }

      return true;
    });

    // Score each file
    const scoredFiles = nonTestFiles.map(file => {
      let score = 0;
      const path = file.path.toLowerCase();
      const filename = path.split('/').pop();

      // Entry points get highest priority
      const entryPoints = ['index.js', 'index.ts', 'main.js', 'main.ts',
                           'app.js', 'app.ts', 'app.jsx', 'app.tsx',
                           'main.py', '__init__.py', '__main__.py'];
      if (entryPoints.includes(filename)) {
        score += 1000;
      }

      // Source directories get high priority
      if (path.includes('src/') || path.includes('lib/') ||
          path.includes('app/') || path.includes('core/')) {
        score += 500;
      }

      // Larger files (use size in bytes from GitHub tree)
      score += (file.size || 0) / 100;

      return { ...file, score };
    });

    // Sort by score descending and take top N
    return scoredFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async checkRateLimit() {
    const { data } = await this.octokit.rateLimit.get();

    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new GitHubService();
