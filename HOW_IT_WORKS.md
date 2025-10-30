# GitInsights - How It Works

## Overview
GitInsights is an AI-powered code analysis tool that analyzes GitHub repositories and provides quality scores, identifies issues, and generates comprehensive PDF reports.

---

## Application Architecture

### Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Claude API (Anthropic)
- **APIs**: GitHub API (Octokit)
- **Caching**: In-memory Map (can be upgraded to Redis)

---

## How the Application Works

### 1. User Journey

```
User → Enter GitHub URL → Select File Limit (1-50) → Click Analyze
  ↓
Frontend sends request to Backend API
  ↓
Backend fetches repository from GitHub
  ↓
Smart file selection prioritizes important files
  ↓
Claude AI analyzes each file for quality
  ↓
Backend generates comprehensive report
  ↓
Frontend displays results in dashboard
  ↓
User can export results as PDF
```

---

## Key Features

### 🎯 Smart File Selection
When a repository has more than the requested file limit, the system intelligently selects files based on:

**Priority Scoring System:**
1. **Entry Points** (+1000 points)
   - index.js, main.js, app.js, App.jsx
   - main.py, __init__.py, __main__.py

2. **Source Directories** (+500 points)
   - Files in src/, lib/, app/, core/

3. **File Size** (variable points)
   - Larger files get more points (size in bytes / 100)
   - Assumption: Larger files contain more logic

**Filtering:**
- Excludes test files (.test., .spec., __tests__/)
- Excludes config files (.config.js, .rc.js)
- Excludes build artifacts (node_modules/, dist/, build/)

**Example:**
- Repository has 142 files
- User requests 15 files
- System analyzes: entry points first, then largest source files

---

### 📊 Quality Analysis (Powered by Claude AI)

Each selected file is analyzed across 5 categories:

#### 1. Structure & Organization (0-100)
- File organization
- Function decomposition
- Module separation
- Code layout

#### 2. Naming & Readability (0-100)
- Variable names
- Function names
- Class names
- Code clarity

#### 3. Error Handling (0-100)
- Try-catch usage
- Error messages
- Edge case handling
- Input validation

#### 4. Documentation (0-100)
- Code comments
- Function docs
- README quality
- API documentation

#### 5. Testing (0-100)
- Test coverage
- Test quality
- Edge case tests
- Integration tests

**Overall Score:** Weighted average of all categories

---

### 🔍 Issue Tracking

The system collects issues from all analyzed files and tracks:
- **Issue Text**: Description of the problem
- **Source File**: Which file has the issue
- **Top 10 Issues**: Most critical issues displayed first

**Example Issue Object:**
```javascript
{
  file: "src/services/analyzerService.js",
  issue: "Missing error handling in async functions"
}
```

---

### 📄 PDF Export (4-5 Pages)

The PDF report includes:

#### Page 1: Cover Page
- Repository name
- Overall quality score (large visual circle)
- Analysis date
- GitInsights branding

#### Page 2: Summary Page
- Statistics cards (Files Analyzed, Total Issues, Average Score)
- Metadata: "Analyzed X of Y code files (Smart selection prioritized)"
- Quality distribution bar chart
- Key insights based on analysis

#### Page 3: Top Issues & Recommendations
- **Top Issues Section**: Up to 10 critical issues with file references
  - Format: "Missing error handling"
  - Sub-text: "File: src/services/analyzerService.js"
- **Recommendations Section**: AI-generated actionable recommendations
  - Based on overall score
  - Prioritized by impact

#### Page 4-5: Files Overview Table
- All analyzed files in a compact table
- Columns: File Path | Score | Rating
- Color-coded scores (green/blue/yellow/red)
- Automatically spans multiple pages if needed

---

## API Endpoints

### Backend API (Port 3000)

#### 1. Health Check
```
GET /api/health
Response: { "status": "ok", "message": "GitInsights API" }
```

#### 2. Analyze Repository
```
POST /api/analyze
Body: {
  "repoUrl": "https://github.com/owner/repo",
  "fileLimit": 15,          // Optional, default: 10, max: 50
  "apiKey": "optional-key"  // Optional user API key
}

Response: {
  "success": true,
  "data": {
    "summary": {
      "filesAnalyzed": 15,
      "overallQuality": 81,
      "requestedFileLimit": 15,
      "totalCodeFiles": 142,
      "timestamp": "2025-10-29T..."
    },
    "quality": {
      "score": 81,
      "issueCount": 35,
      "topIssues": [
        {
          "file": "src/services/analyzerService.js",
          "issue": "Missing error handling"
        },
        ...
      ]
    },
    "files": [
      { "file": "path/to/file.js", "score": 85 },
      ...
    ]
  }
}
```

---

## Frontend Components

### Pages
- **HomePage**: Main analysis interface

### Components

#### 1. RepoUrlInput
- Input for GitHub repository URL
- File limit selector (1-50)
- Validation (GitHub URL format, file limit range)
- Submit button

#### 2. AnalysisDashboard
- Displays analysis results
- Shows metadata (X of Y files analyzed)
- Container for all dashboard components

#### 3. QualityScore
- Large score display with color coding
- Rating label (Excellent/Good/Fair/Poor)

#### 4. FilesList
- Table of analyzed files with scores
- Click to expand for details

#### 5. TopIssues
- List of top 10 issues across all files
- Shows file reference for each issue

#### 6. FileCard
- Detailed view of individual file analysis
- Score breakdown by category
- Issues found with file references
- Recommendations

### Services

#### API Service
```javascript
analyzeRepository(repoUrl, apiKey, fileLimit)
  → POST request to backend
  → Returns analysis data
```

#### PDF Export Service
```javascript
generatePDFReport(analysisData, repoUrl)
  → Creates optimized PDF (4-5 pages)
  → Downloads to user's computer
```

---

## Backend Services

### 1. GitHubService
- Connects to GitHub API using Octokit
- Fetches repository information
- Gets repository tree (all files)
- Retrieves file contents
- **Smart Selection**: Prioritizes important files

**Key Methods:**
- `getRepository(owner, repo)` - Fetch repo info
- `getRepoTree(owner, repo)` - Get all files
- `getFileContent(owner, repo, path)` - Get file content
- `filterCodeFiles(files)` - Filter code files only
- `selectImportantFiles(files, limit)` - Smart file selection
- `parseGitHubUrl(url)` - Parse GitHub URL

### 2. ClaudeService
- Connects to Claude API (Anthropic)
- Sends code analysis prompts
- Parses JSON responses
- Handles rate limiting

**Key Methods:**
- `analyze(prompt, code)` - Send analysis request
- `parseJSON(text)` - Extract JSON from response

### 3. AnalyzerService
- Main orchestration service
- Coordinates GitHub + Claude services
- Generates comprehensive reports
- Handles file limit validation

**Key Methods:**
- `analyzeRepository(repoUrl, apiKey, fileLimit)` - Main entry point
- `analyzeFiles(files, owner, repo, apiKey)` - Batch analyze files
- `analyzeQuality(code, apiKey)` - Analyze single file
- `generateReport(analyses, fileLimit, totalCodeFiles)` - Create report
- `validateFileLimit(fileLimit)` - Validate 1-50 range

### 4. CacheService
- In-memory caching using Map
- 24-hour TTL for analysis results
- Reduces API calls and improves performance

**Key Methods:**
- `get(key)` - Retrieve cached value
- `set(key, value, ttl)` - Store value with expiry
- `generateKey(type, identifier)` - Create cache key

---

## Data Flow

### Analysis Request Flow

```
1. User submits form (URL + File Limit)
   ↓
2. Frontend validates input
   ↓
3. POST /api/analyze request sent
   ↓
4. Backend validates request (Joi schema)
   ↓
5. Check cache for existing analysis
   ↓
6. If not cached:
   a. Parse GitHub URL → extract owner/repo
   b. Fetch repository tree from GitHub API
   c. Filter code files (exclude tests, configs, build files)
   d. Smart selection: Prioritize important files
   e. For each selected file:
      - Fetch file content from GitHub
      - Send to Claude API for analysis
      - Wait 1 second (rate limiting)
   f. Collect all issues with file references
   g. Generate comprehensive report
   h. Cache result for 24 hours
   ↓
7. Return analysis data to frontend
   ↓
8. Frontend displays results in dashboard
```

---

## Validation & Error Handling

### Input Validation
- **Repository URL**: Must contain "github.com"
- **File Limit**: Integer between 1-50
- Invalid inputs show clear error messages

### Error Scenarios Handled
1. **Repository Not Found** (404)
   - "Repository not found"
2. **GitHub Rate Limit** (403)
   - "API rate limit exceeded"
3. **Claude Rate Limit** (429)
   - "Rate limit exceeded, try again later"
4. **Invalid API Key** (401)
   - "Invalid API key"
5. **Network Errors**
   - "Analysis failed, please try again"

---

## Configuration

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_key_here
GITHUB_TOKEN=your_github_token_here
REDIS_URL=redis://localhost:6379
RATE_LIMIT_FREE_TIER=5
RATE_LIMIT_WINDOW_MS=86400000
ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEMO_MODE=true
```

---

## Performance Optimizations

### 1. Caching
- Analysis results cached for 24 hours
- Cache key includes: repo URL + file limit
- Reduces API calls by ~90% for repeated analyses

### 2. Rate Limiting
- 1 second delay between Claude API calls
- Prevents API rate limit errors
- Ensures stable performance

### 3. Smart File Selection
- Analyzes only important files
- Reduces analysis time significantly
- Maintains quality insights

### 4. Demo Mode
- In development, generates mock data
- No API calls during development
- Faster testing and development

---

## Demo Mode

When `NODE_ENV=development`, the system generates mock analysis data:
- Random scores between 70-90
- Simulated issues based on code characteristics
- No actual Claude API calls
- Instant results for testing

**Mock Logic:**
```javascript
- Has comments? → Documentation score = 75, else 50
- Has error handling? → Error handling score = 85, else 60
- Has functions? → Structure score = 85, else 70
- File > 100 lines? → Issue: "File is quite large"
```

---

## Limitations & Constraints

### Current Limitations
1. **File Limit**: Maximum 50 files per analysis
   - Prevents timeouts and excessive API usage

2. **File Size**: No explicit limit, but very large files may timeout

3. **Cache**: In-memory only (lost on server restart)
   - Upgrade to Redis for persistent caching

4. **Rate Limiting**: Sequential file analysis (not parallel)
   - Claude API has rate limits
   - 1 second delay between requests

### API Rate Limits
- **GitHub API**: 5,000 requests/hour (authenticated)
- **Claude API**: Varies by plan
- **Free Tier**: 5 analyses per day (configurable)

---

## Future Enhancements

### Planned Features
1. **User Authentication**: Save analysis history
2. **Comparison Mode**: Compare two repositories
3. **Scheduled Analysis**: Automated daily/weekly scans
4. **Real-time Updates**: WebSocket for progress updates
5. **More Languages**: Support for Python, Java, Go, etc.
6. **Security Scanning**: Vulnerability detection
7. **Performance Metrics**: Benchmark analysis
8. **Team Collaboration**: Share reports with team

---

## Troubleshooting

### Common Issues

#### 1. "Cannot start backend server"
**Cause**: Port 3000 already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill //F //PID <PID>

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### 2. "API rate limit exceeded"
**Cause**: Too many requests to GitHub/Claude API
**Solution:**
- Wait for rate limit reset (shown in error)
- Use user's own API key
- Enable caching

#### 3. "Repository not found"
**Cause**: Invalid URL or private repository
**Solution:**
- Check URL format: https://github.com/owner/repo
- Ensure repository is public
- Verify GitHub token has access

#### 4. "Analysis timeout"
**Cause**: Too many files or large files
**Solution:**
- Reduce file limit
- Analyze smaller repositories first
- Check network connection

---

## Development Workflow

### Starting the Application

1. **Install Dependencies**
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. **Configure Environment**
- Create `backend/.env` with API keys
- Create `frontend/.env` with API URL

3. **Start Backend**
```bash
cd backend && npm run dev
# Runs on http://localhost:3000
```

4. **Start Frontend**
```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
```

5. **Access Application**
- Frontend: http://localhost:5173
- Backend Health: http://localhost:3000/api/health

### Making Changes

1. **Backend Changes**: Nodemon auto-restarts
2. **Frontend Changes**: Vite hot-reloads instantly
3. **Test Changes**: Use demo mode for quick testing

---

## Testing

### Manual Testing

1. **Health Check**
```bash
curl http://localhost:3000/api/health
```

2. **Analysis Request**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/facebook/react","fileLimit":10}'
```

3. **Frontend Testing**
- Enter URL: https://github.com/facebook/react
- Set file limit: 15
- Click Analyze
- Verify results display correctly
- Export PDF and verify format

---

## Security Considerations

### API Keys
- Never commit API keys to git
- Use environment variables
- Rotate keys regularly

### User Input
- All inputs validated with Joi
- GitHub URLs sanitized
- SQL injection not applicable (no database)

### Rate Limiting
- Free tier: 5 requests per day
- Can be configured per IP
- Prevents abuse

---

## Project Structure

```
git-insights/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Server entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── common/     # Reusable components
│   │   │   ├── dashboard/  # Analysis dashboard
│   │   │   ├── forms/      # Input forms
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── main.jsx        # App entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── .claude/                # Claude Code agents & skills
│   ├── agents/            # Specialized agents
│   ├── skills/            # Reusable skills
│   └── commands/          # Slash commands
│
└── todo.md                # Build guide & tasks
```

---

## Support & Resources

### Documentation
- [todo.md](./todo.md) - Complete build guide
- [.claude/](../.claude/) - Agent configurations

### APIs Used
- [GitHub API](https://docs.github.com/en/rest)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [jsPDF](https://github.com/parallax/jsPDF)

### Contact
For issues or questions, check the project repository.

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
