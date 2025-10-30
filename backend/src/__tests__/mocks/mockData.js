// Mock data for tests

export const mockGitHubRepo = {
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
};

export const mockRepoTree = [
  {
    path: 'src/index.js',
    type: 'blob',
    size: 2048,
    sha: 'abc123'
  },
  {
    path: 'src/utils/helper.js',
    type: 'blob',
    size: 1024,
    sha: 'def456'
  },
  {
    path: 'src/services/api.js',
    type: 'blob',
    size: 3072,
    sha: 'ghi789'
  },
  {
    path: 'tests/index.test.js',
    type: 'blob',
    size: 512,
    sha: 'jkl012'
  },
  {
    path: 'node_modules/package/index.js',
    type: 'blob',
    size: 256,
    sha: 'mno345'
  },
  {
    path: 'README.md',
    type: 'blob',
    size: 1024,
    sha: 'pqr678'
  }
];

export const mockFileContent = `
import express from 'express';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
`;

export const mockClaudeResponse = {
  id: 'msg_123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        overall: 85,
        structure: {
          score: 90,
          issues: ['Consider breaking large functions into smaller ones'],
          recommendations: ['Use more modular design patterns']
        },
        naming: {
          score: 85,
          issues: [],
          recommendations: ['Use more descriptive variable names']
        },
        errorHandling: {
          score: 80,
          issues: ['Add more specific error messages'],
          recommendations: ['Implement proper error handling middleware']
        },
        documentation: {
          score: 75,
          issues: ['Missing JSDoc comments'],
          recommendations: ['Add comprehensive documentation']
        },
        testing: {
          score: 70,
          issues: ['Insufficient test coverage'],
          recommendations: ['Add unit and integration tests']
        }
      })
    }
  ],
  model: 'claude-sonnet-4',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 100,
    output_tokens: 200
  }
};

export const mockAnalysisResult = {
  summary: {
    filesAnalyzed: 3,
    overallQuality: 85,
    requestedFileLimit: 10,
    totalCodeFiles: 3,
    timestamp: '2025-01-15T12:00:00.000Z'
  },
  quality: {
    score: 85,
    issueCount: 4,
    topIssues: [
      {
        file: 'src/index.js',
        issue: 'Consider breaking large functions into smaller ones'
      },
      {
        file: 'src/index.js',
        issue: 'Add more specific error messages'
      },
      {
        file: 'src/index.js',
        issue: 'Missing JSDoc comments'
      },
      {
        file: 'src/index.js',
        issue: 'Insufficient test coverage'
      }
    ]
  },
  files: [
    {
      file: 'src/index.js',
      score: 85
    },
    {
      file: 'src/utils/helper.js',
      score: 88
    },
    {
      file: 'src/services/api.js',
      score: 82
    }
  ]
};

export const mockCodeQualityAnalysis = {
  overall: 85,
  structure: {
    score: 90,
    issues: ['Consider breaking large functions into smaller ones'],
    recommendations: ['Use more modular design patterns']
  },
  naming: {
    score: 85,
    issues: [],
    recommendations: ['Use more descriptive variable names']
  },
  errorHandling: {
    score: 80,
    issues: ['Add more specific error messages'],
    recommendations: ['Implement proper error handling middleware']
  },
  documentation: {
    score: 75,
    issues: ['Missing JSDoc comments'],
    recommendations: ['Add comprehensive documentation']
  },
  testing: {
    score: 70,
    issues: ['Insufficient test coverage'],
    recommendations: ['Add unit and integration tests']
  }
};
