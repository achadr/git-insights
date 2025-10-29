import { Octokit } from '@octokit/rest';
import config from '../config/env.js';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: config.GITHUB_TOKEN
    });
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
        throw new Error('Repository not found');
      }
      if (error.status === 403) {
        throw new Error('API rate limit exceeded');
      }
      throw error;
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
      throw error;
    }
  }

  async getFileContent(owner, repo, path) {
    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path });

      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return data.content;
    } catch (error) {
      throw error;
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
