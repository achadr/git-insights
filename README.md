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

1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your API keys
```

3. Start development servers:
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

## Development

Built using Claude Code agents:
- `backend-agent` - API development
- `frontend-agent` - UI development
- `analyzer-agent` - Analysis logic
- `integration-agent` - External APIs

Quality assured with CodeGuardian agents.

## License

MIT
