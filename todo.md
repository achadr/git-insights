# GitInsights - Complete Build Guide

## Prerequisites

### Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Create Environment Files

**backend/.env:**
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

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEMO_MODE=true
```

---

## Phase 1: Backend Core

### Task 1: Create Core Server Files

Use backend-agent to create these files:

**backend/src/index.js:**
- Initialize Express app
- Add middleware: cors, helmet, express.json()
- Create /api/health endpoint that returns {status: 'ok', message: 'GitInsights API'}
- Add error handler middleware at the end
- Start server on process.env.PORT || 3000
- Log "Server running on port {PORT}"

**backend/src/config/env.js:**
- Import dotenv and configure
- Export object with: PORT, ANTHROPIC_API_KEY, GITHUB_TOKEN, REDIS_URL, NODE_ENV, ALLOWED_ORIGINS
- Throw error if ANTHROPIC_API_KEY or GITHUB_TOKEN missing

**backend/src/middleware/errorHandler.js:**
- Export errorHandler function (err, req, res, next)
- If err.message includes 'not found': return 404 with {success: false, error: {message, code: 'NOT_FOUND'}}
- If err.message includes 'Rate limit': return 429 with {success: false, error: {message, code: 'RATE_LIMIT'}}
- Default: return 500 with {success: false, error: {message: 'Internal server error', code: 'INTERNAL_ERROR'}}
- Log all errors to console

**backend/src/middleware/cors.js:**
- Import cors from 'cors'
- Export cors configuration with origin: process.env.ALLOWED_ORIGINS, credentials: true

**backend/src/utils/logger.js:**
- Import winston
- Create logger with Console transport
- Format: timestamp + level + message
- Level: 'info' for production, 'debug' for development
- Export logger

Test: Run `npm run dev` in backend, then `curl http://localhost:3000/api/health` should return {"status":"ok","message":"GitInsights API"}

---

### Task 2: Create GitHub Service

Use integration-agent and github-integration skill to create:

**backend/src/services/githubService.js:**

Create class GitHubService with:

**Constructor:**
- Import Octokit from '@octokit/rest'
- Initialize this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

**Method: async getRepository(owner, repo)**
- Call this.octokit.repos.get({ owner, repo })
- Return object: {name, fullName: full_name, description, url: html_url, language, stars: stargazers_count, forks: forks_count, size, defaultBranch: default_branch, topics}
- Catch error: if status 404 throw 'Repository not found', if status 403 throw 'API rate limit exceeded'

**Method: async getRepoTree(owner, repo, branch = 'main')**
- Try to get ref for 'main' branch: this.octokit.git.getRef({owner, repo, ref: 'heads/main'})
- If fails, try 'master' branch
- Get tree: this.octokit.git.getTree({owner, repo, tree_sha, recursive: 'true'})
- Return data.tree filtered to only items where type === 'blob'

**Method: async getFileContent(owner, repo, path)**
- Call this.octokit.repos.getContent({owner, repo, path})
- If data.encoding === 'base64', decode: Buffer.from(data.content, 'base64').toString('utf-8')
- Return decoded content

**Method: parseGitHubUrl(url)**
- Match patterns: /github\.com\/([^\/]+)\/([^\/]+)/ or /^([^\/]+)\/([^\/]+)$/
- Extract owner and repo (remove .git suffix from repo)
- Return {owner, repo}
- If no match, throw 'Invalid GitHub URL format'

**Method: filterCodeFiles(files)**
- Filter files where path ends with: .js, .jsx, .ts, .tsx, .py, .java, .go
- Exclude if path includes: node_modules/, dist/, build/, .git/, vendor/, target/
- Return filtered array

**Method: async checkRateLimit()**
- Call this.octokit.rateLimit.get()
- Return {limit: data.rate.limit, remaining: data.rate.remaining, reset: new Date(data.rate.reset * 1000)}

**Method: sleep(ms)**
- Return new Promise(resolve => setTimeout(resolve, ms))

Export: export default new GitHubService()

Test: node -e "require('./src/services/githubService.js').default.getRepository('facebook','react').then(r => console.log(r.name, r.stars))"

---

### Task 3: Create Claude Service

Use integration-agent to create:

**backend/src/services/claudeService.js:**

Create class ClaudeService with:

**Constructor:**
- Import Anthropic from '@anthropic-ai/sdk'
- Initialize this.client = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
- Set this.model = 'claude-sonnet-4'

**Method: async analyze(prompt, code)**
- Create message: await this.client.messages.create({model: this.model, max_tokens: 4096, messages: [{role: 'user', content: prompt}]})
- Return message.content[0].text
- Catch errors: if error.status === 429 throw 'Rate limit exceeded', if error.status === 401 throw 'Invalid API key'

**Method: parseJSON(text)**
- Try to extract JSON with regex: text.match(/\{[\s\S]*\}/)
- If no match, throw 'No JSON found in response'
- Parse and return JSON.parse(match[0])
- Catch parse error and throw 'Failed to parse Claude response'

**Method: sleep(ms)**
- Return new Promise(resolve => setTimeout(resolve, ms))

Export: export default new ClaudeService()

---

### Task 4: Create Cache Service

Use integration-agent to create:

**backend/src/services/cacheService.js:**

Create class CacheService with:

**Constructor:**
- Initialize this.cache = new Map()
- Set this.DEFAULT_TTL = 60 * 60 * 24 (24 hours in seconds)

**Method: get(key)**
- Get entry from this.cache
- If not found, return null
- Check if expired: if entry.expiry < Date.now(), delete and return null
- Return entry.value

**Method: set(key, value, ttl = this.DEFAULT_TTL)**
- Calculate expiry: Date.now() + (ttl * 1000)
- Store in this.cache: {value, expiry}

**Method: delete(key)**
- Call this.cache.delete(key)

**Method: exists(key)**
- Get entry, check not null and not expired

**Method: generateKey(type, identifier)**
- Return `gitinsights:${type}:${identifier}`

**Method: clear()**
- Call this.cache.clear()

Export: export default new CacheService()

---

### Task 5: Create Analyzer Service

Use analyzer-agent and code-analyzer skill to create:

**backend/src/services/analyzerService.js:**

Import: githubService, claudeService, cacheService

Create class AnalyzerService with:

**Method: async analyzeRepository(repoUrl, userApiKey = null)**
- Generate cache key: cacheService.generateKey('analysis', repoUrl)
- Check cache: const cached = await cacheService.get(key), if exists return cached
- Parse URL: const {owner, repo} = githubService.parseGitHubUrl(repoUrl)
- Fetch files: const files = await githubService.getRepoTree(owner, repo)
- Filter: const codeFiles = githubService.filterCodeFiles(files)
- Limit to 10 files: codeFiles.slice(0, 10)
- Analyze: const analyses = await this.analyzeFiles(codeFiles, owner, repo, userApiKey)
- Generate report: const report = this.generateReport(analyses)
- Cache: await cacheService.set(key, report, 86400)
- Return report

**Method: async analyzeFiles(files, owner, repo, userApiKey)**
- Create empty array: const results = []
- Loop through files:
  - Get content: const content = await githubService.getFileContent(owner, repo, file.path)
  - Analyze: const analysis = await this.analyzeQuality(content, userApiKey)
  - Push: results.push({file: file.path, analysis})
  - Wait: await this.sleep(1000)
  - Catch errors and continue
- Return results

**Method: async analyzeQuality(code, userApiKey)**
- Create prompt: "You are a senior code reviewer. Analyze this code and provide quality assessment. Evaluate (0-100 each): 1. Structure & Organization 2. Naming & Readability 3. Error Handling 4. Documentation 5. Testing. Return ONLY valid JSON: {overall: 85, structure: {score: 90, issues: [], recommendations: []}, naming: {score: 85, issues: [], recommendations: []}, errorHandling: {score: 75, issues: [], recommendations: []}, documentation: {score: 80, issues: [], recommendations: []}, testing: {score: 90, issues: [], recommendations: []}}. Code: " + code
- Call: const response = await claudeService.analyze(prompt, '')
- Parse: return claudeService.parseJSON(response)

**Method: generateReport(analyses)**
- Calculate average: scores = analyses.map(a => a.analysis.overall), avgScore = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)
- Collect issues: allIssues = analyses.flatMap(a => Object.values(a.analysis).flatMap(v => v.issues || []))
- Return: {summary: {filesAnalyzed: analyses.length, overallQuality: avgScore, timestamp: new Date().toISOString()}, quality: {score: avgScore, issueCount: allIssues.length, topIssues: allIssues.slice(0, 10)}, files: analyses.map(a => ({file: a.file, score: a.analysis.overall}))}

**Method: sleep(ms)**
- Return new Promise(resolve => setTimeout(resolve, ms))

Export: export default new AnalyzerService()

---

### Task 6: Create Analysis Endpoint

Use backend-agent and api-builder skill to create:

**backend/src/middleware/validator.js:**
- Import Joi from 'joi'
- Create schema: Joi.object({repoUrl: Joi.string().uri().pattern(/github\.com/).required(), apiKey: Joi.string().optional()})
- Export validateRepoUrl function: validate req.body, if error return res.status(400).json({success: false, error: {message: error.details[0].message, code: 'VALIDATION_ERROR'}}), else call next()

**backend/src/controllers/analysisController.js:**
- Import analyzerService and logger
- Export async function analyzeRepository(req, res, next):
  - Extract: const {repoUrl, apiKey} = req.body
  - Log: logger.info('Analysis requested', {repoUrl})
  - Call: const result = await analyzerService.analyzeRepository(repoUrl, apiKey)
  - Return: res.json({success: true, data: result})
  - Catch: logger.error('Analysis failed', {error}), next(error)

**backend/src/routes/analysis.js:**
- Import express, controller, validator
- Create router: const router = express.Router()
- Add route: router.post('/analyze', validator.validateRepoUrl, controller.analyzeRepository)
- Export: export default router

**Update backend/src/index.js:**
- Import analysisRoutes from './routes/analysis.js'
- Add: app.use('/api', analysisRoutes)

Test: curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"repoUrl":"https://github.com/facebook/react"}'

---

## Phase 2: Frontend

### Task 7: Create Frontend Layout

Use frontend-agent and react-component skill to create:

**frontend/src/App.jsx:**
- Import Layout, HomePage from components
- Create App component that returns <Layout><HomePage /></Layout>
- Export App

**frontend/src/components/layout/Layout.jsx:**
- Import Header, Footer
- Export Layout component: <div className="min-h-screen flex flex-col bg-gray-50"><Header /><main className="flex-1 container mx-auto px-4 py-8">{children}</main><Footer /></div>

**frontend/src/components/layout/Header.jsx:**
- Export Header component:
  - <header className="bg-white border-b border-gray-200">
  - Inside: logo "GitInsights" (text-2xl font-bold text-blue-600)
  - Navigation links: Home, Examples, Docs

**frontend/src/components/layout/Footer.jsx:**
- Export Footer component:
  - <footer className="bg-white border-t border-gray-200 py-6">
  - Text: "GitInsights © 2025 - AI-Powered Code Analysis"

**frontend/src/pages/HomePage.jsx:**
- Import useState
- Export HomePage component:
  - Title: "Analyze Your GitHub Repository"
  - Subtitle: "Get AI-powered insights about code quality, security, and performance"
  - Input for repository URL
  - Button: "Analyze"
  - Show results area (placeholder for now)

Test: npm run dev in frontend, should open http://localhost:5173 and show layout

---

### Task 8: Create API Service

Use frontend-agent to create:

**frontend/src/services/api.js:**
- Import axios
- Create baseURL: import.meta.env.VITE_API_URL
- Export async function analyzeRepository(repoUrl, apiKey = null):
  - POST to `${baseURL}/analyze`
  - Body: {repoUrl, apiKey}
  - Return response.data
  - Catch and throw error.response?.data?.error?.message || 'Analysis failed'

---

### Task 9: Create Analysis Form

Use frontend-agent and react-component skill to create:

**frontend/src/components/forms/RepoUrlInput.jsx:**
- Import useState
- Export RepoUrlInput component with props: {onSubmit}
- State: url, error, isLoading
- validateUrl function: check if matches /github\.com/
- handleSubmit: validate, set loading, call onSubmit(url), handle errors
- Return form with:
  - Input for URL (value, onChange)
  - Error message if error
  - Submit button (disabled when loading)

**Update frontend/src/pages/HomePage.jsx:**
- Import RepoUrlInput, analyzeRepository from api
- Add state: analysis, loading, error
- Create handleAnalyze function: call analyzeRepository, set analysis state
- Replace placeholder input with <RepoUrlInput onSubmit={handleAnalyze} />
- Show loading state: "Analyzing..." with spinner
- Show results when analysis exists

---

### Task 10: Create Dashboard Components

Use frontend-agent and react-component skill to create:

**frontend/src/components/dashboard/AnalysisDashboard.jsx:**
- Export AnalysisDashboard component with props: {data}
- Layout: Grid with 3 columns (responsive: 1 col mobile, 2 tablet, 3 desktop)
- Show: QualityScore, FilesList, TopIssues components

**frontend/src/components/dashboard/QualityScore.jsx:**
- Export QualityScore component with props: {score}
- Show large score number (text-5xl font-bold)
- Color based on score: green (80+), blue (60-79), yellow (40-59), red (<40)
- Show "out of 100" text below

**frontend/src/components/dashboard/FilesList.jsx:**
- Export FilesList component with props: {files}
- Map through files and show: filename, score for each
- Style as list with file icons

**frontend/src/components/dashboard/TopIssues.jsx:**
- Export TopIssues component with props: {issues}
- Show list of issues (max 10)
- Each issue: bullet point with description

**frontend/src/components/common/LoadingSpinner.jsx:**
- Export LoadingSpinner component
- Return animated spinning SVG circle
- Tailwind animate-spin class

**frontend/src/components/common/ErrorMessage.jsx:**
- Export ErrorMessage component with props: {message}
- Show red background alert with error icon and message

**Update frontend/src/pages/HomePage.jsx:**
- Import AnalysisDashboard, LoadingSpinner, ErrorMessage
- Show LoadingSpinner when loading
- Show ErrorMessage when error
- Show AnalysisDashboard when analysis exists

Test: Enter a GitHub URL, click Analyze, should show analysis results after 30-60 seconds

---

## Success Criteria

Backend:
- ✅ Server runs on port 3000
- ✅ /api/health returns status ok
- ✅ /api/analyze accepts GitHub URL
- ✅ Returns analysis with quality score, files, issues

Frontend:
- ✅ Runs on port 5173
- ✅ Shows input form for GitHub URL
- ✅ Connects to backend API
- ✅ Displays analysis results in dashboard
- ✅ Shows loading and error states

Complete Application:
- ✅ User can enter any GitHub repo URL
- ✅ System analyzes up to 10 code files
- ✅ Shows overall quality score (0-100)
- ✅ Lists analyzed files with individual scores
- ✅ Shows top issues found
- ✅ Results are cached for 24 hours