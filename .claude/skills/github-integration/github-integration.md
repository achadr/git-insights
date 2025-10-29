---
name: github-integration
description: Integrates with GitHub API to fetch repository data, files, and metadata
allowed_tools: [Bash, Read]
---

# GitHub Integration Skill

I handle all GitHub API interactions including repository fetching, file content retrieval, and metadata extraction.

## Setup

### Initialize Octokit
````javascript
// services/githubService.js
import { Octokit } from '@octokit/rest';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'GitInsights v1.0',
      timeZone: 'UTC',
      baseUrl: 'https://api.github.com',
    });
  }
}
````

## Core Methods

### Get Repository Information
````javascript
async getRepository(owner, repo) {
  try {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      url: data.html_url,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      size: data.size,
      defaultBranch: data.default_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
      topics: data.topics || [],
      license: data.license?.name || null,
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error('Repository not found');
    }
    if (error.status === 403) {
      throw new Error('API rate limit exceeded');
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
}
````

### Get Repository Tree (All Files)
````javascript
async getRepoTree(owner, repo, branch = 'main') {
  try {
    // Try main first, fallback to master
    let treeSha = branch;
    
    try {
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      treeSha = ref.object.sha;
    } catch {
      // Try master if main doesn't exist
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: 'heads/master',
      });
      treeSha = ref.object.sha;
    }
    
    // Get tree recursively
    const { data } = await this.octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: 'true',
    });
    
    return data.tree.filter(item => item.type === 'blob');
  } catch (error) {
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }
}
````

### Get File Content
````javascript
async getFileContent(owner, repo, path) {
  try {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    
    // Decode base64 content
    if (data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    }
    
    return data.content;
  } catch (error) {
    if (error.status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to fetch file: ${error.message}`);
  }
}
````

### Get Multiple Files (Batch)
````javascript
async getMultipleFiles(owner, repo, paths) {
  const results = [];
  
  for (const path of paths) {
    try {
      const content = await this.getFileContent(owner, repo, path);
      results.push({
        path,
        content,
        success: true,
      });
      
      // Rate limiting
      await this.sleep(100);
    } catch (error) {
      results.push({
        path,
        error: error.message,
        success: false,
      });
    }
  }
  
  return results;
}
````

### Get Repository Languages
````javascript
async getLanguages(owner, repo) {
  try {
    const { data } = await this.octokit.repos.listLanguages({
      owner,
      repo,
    });
    
    // Calculate percentages
    const total = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);
    
    const languages = Object.entries(data).map(([language, bytes]) => ({
      language,
      bytes,
      percentage: ((bytes / total) * 100).toFixed(2),
    }));
    
    // Sort by percentage
    return languages.sort((a, b) => b.percentage - a.percentage);
  } catch (error) {
    throw new Error(`Failed to fetch languages: ${error.message}`);
  }
}
````

### Get Repository Contributors
````javascript
async getContributors(owner, repo, limit = 10) {
  try {
    const { data } = await this.octokit.repos.listContributors({
      owner,
      repo,
      per_page: limit,
    });
    
    return data.map(contributor => ({
      username: contributor.login,
      avatar: contributor.avatar_url,
      contributions: contributor.contributions,
      url: contributor.html_url,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch contributors: ${error.message}`);
  }
}
````

### Get Recent Commits
````javascript
async getRecentCommits(owner, repo, limit = 10) {
  try {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    });
    
    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch commits: ${error.message}`);
  }
}
````

### Check Rate Limit
````javascript
async checkRateLimit() {
  try {
    const { data } = await this.octokit.rateLimit.get();
    
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
      used: data.rate.used,
    };
  } catch (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`);
  }
}
````

## Utility Functions

### Parse GitHub URL
````javascript
parseGitHubUrl(url) {
  // Patterns to match
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,           // https://github.com/owner/repo
    /^([^\/]+)\/([^\/]+)$/,                       // owner/repo
    /github\.com:([^\/]+)\/([^\/]+)\.git/,       // git@github.com:owner/repo.git
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }
  
  throw new Error('Invalid GitHub URL format');
}
````

### Filter Code Files
````javascript
filterCodeFiles(files) {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.java', '.go', '.rb',
    '.php', '.cpp', '.c', '.cs',
    '.swift', '.kt', '.rs', '.scala',
  ];
  
  const excludePaths = [
    'node_modules/',
    'dist/',
    'build/',
    '.git/',
    'vendor/',
    'target/',
    '.next/',
    'coverage/',
    '__pycache__/',
  ];
  
  return files.filter(file => {
    // Check if it's a code file
    const isCodeFile = codeExtensions.some(ext => 
      file.path.endsWith(ext)
    );
    
    // Check if it's not in excluded paths
    const isExcluded = excludePaths.some(path =>
      file.path.includes(path)
    );
    
    return isCodeFile && !isExcluded;
  });
}
````

### Validate Repository Access
````javascript
async validateRepository(owner, repo) {
  try {
    await this.getRepository(owner, repo);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}
````

## Error Handling

### Retry with Exponential Backoff
````javascript
async retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on 404 or 403
      if ([404, 403].includes(error.status)) {
        throw error;
      }
      
      // Last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait with exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await this.sleep(delay);
    }
  }
}
````

### Handle Rate Limiting
````javascript
async withRateLimitCheck(fn) {
  // Check rate limit before making request
  const rateLimit = await this.checkRateLimit();
  
  if (rateLimit.remaining < 10) {
    const waitTime = rateLimit.reset - new Date();
    throw new Error(
      `Rate limit almost exceeded. Resets in ${Math.ceil(waitTime / 1000 / 60)} minutes`
    );
  }
  
  return await fn();
}
````

## Complete Service Implementation
````javascript
// services/githubService.js
import { Octokit } from '@octokit/rest';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  // All methods above...

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new GitHubService();
````

## Usage Examples

### Analyze Repository
````javascript
// controllers/analysisController.js
import githubService from '../services/githubService.js';

export async function analyzeRepository(req, res, next) {
  try {
    const { repoUrl } = req.body;
    
    // Parse URL
    const { owner, repo } = githubService.parseGitHubUrl(repoUrl);
    
    // Validate access
    const validation = await githubService.validateRepository(owner, repo);
    if (!validation.valid) {
      return res.status(404).json({
        error: validation.error,
      });
    }
    
    // Get repository info
    const repoInfo = await githubService.getRepository(owner, repo);
    
    // Get files
    const files = await githubService.getRepoTree(owner, repo);
    const codeFiles = githubService.filterCodeFiles(files);
    
    // Get languages
    const languages = await githubService.getLanguages(owner, repo);
    
    res.json({
      repository: repoInfo,
      files: codeFiles.length,
      languages,
    });
  } catch (error) {
    next(error);
  }
}
````

## Best Practices

1. **Authentication**: Always use a GitHub token
2. **Rate Limiting**: Check remaining rate limit
3. **Error Handling**: Handle 404, 403 gracefully
4. **Caching**: Cache repository data
5. **Retries**: Retry transient failures
6. **Timeouts**: Set request timeouts
7. **Filtering**: Filter out non-code files
8. **Logging**: Log all API calls

## Rate Limits

GitHub API Rate Limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour
- **Search**: 30 requests/minute

Always use authentication token to get higher limits.