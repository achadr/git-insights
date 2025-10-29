import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import analysisRoutes from './routes/analysis.js';

const app = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GitInsights API'
  });
});

// Routes
app.use('/api', analysisRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
