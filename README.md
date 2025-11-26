# GitInsights

AI-powered repository analysis dashboard that provides insights about code quality, security, and performance.

## Project Structure

- `/backend` - Express.js API server
- `/frontend` - React application
- `/.claude` - Build agents and skills
- `/.claude-quality` - CodeGuardian quality agents
- `/docs` - Documentation

## Tech Stack

### Backend
- Node.js + Express
- Claude API (Anthropic)
- GitHub API (Octokit)
- Redis (caching)

### Frontend
- React 18
- Vite
- TailwindCSS
- React Query
- Recharts

## Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Redis (optional, for rate limiting)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/git-insights.git
cd git-insights
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure Environment Variables

IMPORTANT: This step is critical for security and functionality.

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and replace placeholder values with your actual credentials:

1. **Anthropic API Key** (REQUIRED)
   - Sign up at https://console.anthropic.com/
   - Navigate to API Keys section
   - Create a new API key
   - Add to .env: `ANTHROPIC_API_KEY=your-actual-key-here`

2. **GitHub Personal Access Token** (REQUIRED)
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "GitInsights Development")
   - Select scopes:
     - `repo` (Full control of private repositories)
     - `read:user` (Read user profile data)
   - Generate token and copy it
   - Add to .env: `GITHUB_TOKEN=your-actual-token-here`

3. **Redis Configuration** (OPTIONAL)
   - If not configured, in-memory storage will be used
   - Install Redis: https://redis.io/docs/getting-started/
   - Add to .env: `REDIS_URL=redis://localhost:6379`

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your backend URL:
```
VITE_API_URL=http://localhost:3000
```

### 4. Start Development Servers

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3000

### 5. Verify Setup

Visit http://localhost:5174 and try analyzing a public GitHub repository.

If you encounter errors:
- Check that all environment variables are set correctly
- Ensure Redis is running (if configured)
- Review backend console logs for detailed error messages
- See the Troubleshooting section below

## Security Best Practices

CRITICAL: Follow these security practices to protect your API keys:

1. **Never commit .env files to version control**
   - The `.env` file is already in `.gitignore`
   - Always verify before committing: `git status`

2. **Rotate compromised keys immediately**
   - If you accidentally commit API keys, rotate them immediately
   - Revoke the old keys in the respective dashboards
   - Generate new keys and update your .env file

3. **Use different keys for different environments**
   - Development keys for local development
   - Production keys for deployed applications
   - Never use production keys in development

4. **Limit API key permissions**
   - GitHub: Only grant necessary scopes (repo, read:user)
   - Anthropic: Use separate keys for different projects

5. **Monitor API usage**
   - Regularly check your API usage dashboards
   - Set up billing alerts to detect unusual activity
   - Review access logs periodically

6. **Keep dependencies updated**
   - Regularly run `npm audit` to check for vulnerabilities
   - Update dependencies to patch security issues

## Troubleshooting

### Server won't start

1. **Missing environment variables**
   ```
   Error: ANTHROPIC_API_KEY is required
   ```
   Solution: Ensure all required variables in `.env` are set with actual values

2. **Port already in use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   Solution: Change PORT in `.env` or kill the process using the port

3. **Invalid API keys**
   ```
   Error: Authentication failed
   ```
   Solution: Verify your API keys are correct and not expired

### Rate limiting issues

1. **Redis connection failed**
   ```
   Warning: Redis URL not configured - using in-memory storage
   ```
   Solution: Install and start Redis, or continue with in-memory storage

2. **Rate limit exceeded**
   ```
   Error: Rate limit exceeded
   ```
   Solution: Wait for the rate limit window to reset (default: 24 hours)

### CORS errors

1. **Blocked by CORS policy**
   ```
   Access to fetch has been blocked by CORS policy
   ```
   Solution: Ensure frontend URL is in `ALLOWED_ORIGINS` in backend/.env

## License

MIT
