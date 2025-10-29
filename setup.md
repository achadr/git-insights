# GitInsights - Project Setup

## Objective
Set up the complete file and folder structure for GitInsights with all necessary configuration files.

## Directory Structure to Create
````
gitinsights/
├── .claude/
│   ├── agents/
│   │   ├── backend-agent/
│   │   ├── frontend-agent/
│   │   ├── analyzer-agent/
│   │   └── integration-agent/
│   ├── skills/
│   │   ├── api-builder/
│   │   ├── react-component/
│   │   ├── code-analyzer/
│   │   └── github-integration/
│   └── commands/
├── .claude-quality/
│   ├── agents/
│   │   ├── review-agent/
│   │   ├── security-agent/
│   │   └── perf-agent/
│   ├── skills/
│   │   ├── code-review/
│   │   ├── refactor/
│   │   ├── test-gen/
│   │   └── docs-gen/
│   └── commands/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── tests/
│       ├── unit/
│       └── integration/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   ├── dashboard/
│       │   ├── charts/
│       │   ├── forms/
│       │   └── common/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── store/
│       └── styles/
├── docs/
└── scripts/
````

## Step 1: Create All Directories

Create every directory listed above, including empty placeholder files where needed.

## Step 2: Initialize Backend

Create `backend/package.json`:
````json
{
  "name": "gitinsights-backend",
  "version": "1.0.0",
  "description": "Backend API for GitInsights",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "keywords": ["ai", "code-analysis", "github"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@anthropic-ai/sdk": "^0.9.1",
    "@octokit/rest": "^20.0.2",
    "ioredis": "^5.3.2",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.1"
  }
}
````

## Step 3: Initialize Frontend

Create `frontend/package.json`:
````json
{
  "name": "gitinsights-frontend",
  "version": "1.0.0",
  "description": "Frontend for GitInsights",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "@tanstack/react-query": "^5.14.2",
    "zustand": "^4.4.7",
    "recharts": "^2.10.3",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.1"
  }
}
````

## Step 4: Backend Configuration Files

Create `backend/.env.example`:
````env
NODE_ENV=development
PORT=3000

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# GitHub API
GITHUB_TOKEN=your_github_token_here

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_FREE_TIER=5
RATE_LIMIT_WINDOW_MS=86400000

# CORS
ALLOWED_ORIGINS=http://localhost:5173
````

Create `backend/.eslintrc.json`:
````json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
````

Create `backend/.prettierrc`:
````json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
````

Create `backend/jest.config.js`:
````javascript
export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {}
};
````

## Step 5: Frontend Configuration Files

Create `frontend/.env.example`:
````env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEMO_MODE=true
````

Create `frontend/vite.config.js`:
````javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
````

Create `frontend/tailwind.config.js`:
````javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};
````

Create `frontend/postcss.config.js`:
````javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
````

Create `frontend/.eslintrc.json`:
````json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
````

Create `frontend/.prettierrc`:
````json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "jsxSingleQuote": false
}
````

## Step 6: Root Configuration Files

Create `.gitignore`:
````
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Cache
.cache/
.parcel-cache/
````

Create `README.md`:
````markdown
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
````

Create `LICENSE`:
````
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## Step 7: Create Entry Point Placeholders

Create `backend/src/index.js`:
````javascript
// Entry point - to be implemented by backend-agent
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GitInsights API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
````

Create `frontend/src/main.jsx`:
````jsx
// Entry point - to be implemented by frontend-agent
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
````

Create `frontend/src/App.jsx`:
````jsx
// Main app component - to be implemented by frontend-agent
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-center pt-20">
        GitInsights
      </h1>
      <p className="text-center text-gray-600 mt-4">
        AI-powered repository analysis
      </p>
    </div>
  );
}

export default App;
````

Create `frontend/src/styles/index.css`:
````css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
````

Create `frontend/index.html`:
````html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GitInsights - AI Repository Analysis</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
````

## Step 8: Verification

After setup, verify:

1. All directories exist
2. All configuration files are created
3. package.json files are valid
4. Can run `npm install` in both backend and frontend
5. Can start both dev servers without errors

## Commands to Run After Setup
````bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Test backend
cd ../backend
npm run dev
# Should see: "Server running on port 3000"

# Test frontend (in new terminal)
cd frontend
npm run dev
# Should open browser to http://localhost:5173
````

## Success Criteria

✅ Complete directory structure created
✅ All package.json files configured
✅ All config files in place (.eslintrc, .prettierrc, etc.)
✅ Environment variable templates created
✅ Entry point files with placeholders
✅ Both servers can start successfully
✅ Git repository initialized
✅ Ready for agent development

## Next Steps

After setup is complete:
1. Initialize git: `git init`
2. Create initial commit
3. Start using agents to build features
4. Use CodeGuardian for quality checks