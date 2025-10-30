import analyzerService from '../services/analyzerService.js';
import logger from '../utils/logger.js';

/**
 * Standard REST endpoint for repository analysis
 * Returns the complete analysis result after processing
 */
export const analyzeRepository = async (req, res, next) => {
  try {
    const { repoUrl, apiKey, fileLimit = 10 } = req.body;

    // Use API key from header (set by apiKeyBypass middleware) if available,
    // otherwise fall back to body parameter
    const userApiKey = req.userAnthropicApiKey || apiKey;

    logger.info('Analysis requested', {
      repoUrl,
      fileLimit,
      usingUserApiKey: !!userApiKey
    });

    const result = await analyzerService.analyzeRepository(repoUrl, userApiKey, fileLimit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    next(error);
  }
};

/**
 * Server-Sent Events endpoint for repository analysis
 * Streams real-time progress updates during analysis
 */
export const analyzeRepositoryStream = async (req, res, next) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  sendSSEEvent(res, {
    stage: 'connected',
    message: 'Connected to analysis stream',
    progress: 0
  });

  try {
    const { repoUrl, apiKey, fileLimit = 10 } = req.body;

    // Use API key from header (set by apiKeyBypass middleware) if available,
    // otherwise fall back to body parameter
    const userApiKey = req.userAnthropicApiKey || apiKey;

    logger.info('SSE Analysis requested', {
      repoUrl,
      fileLimit,
      usingUserApiKey: !!userApiKey
    });

    // Progress callback to send updates via SSE
    const progressCallback = (progressData) => {
      sendSSEEvent(res, progressData);
    };

    // Perform analysis with progress tracking
    const result = await analyzerService.analyzeRepository(
      repoUrl,
      userApiKey,
      fileLimit,
      progressCallback
    );

    // Send final complete event with full results
    sendSSEEvent(res, {
      stage: 'complete',
      message: 'Analysis complete',
      progress: 100,
      data: result
    });

    // Close the connection
    res.end();

    logger.info('SSE Analysis completed', { repoUrl });
  } catch (error) {
    logger.error('SSE Analysis failed', { error: error.message });

    // Send error event
    sendSSEEvent(res, {
      stage: 'error',
      message: error.message || 'Analysis failed',
      progress: 0,
      data: {
        error: error.message,
        code: error.code || 'ANALYSIS_ERROR'
      }
    });

    // Close the connection
    res.end();
  }
};

/**
 * Helper function to send SSE events
 * @param {Object} res - Express response object
 * @param {Object} data - Event data to send
 */
function sendSSEEvent(res, data) {
  // Format data as SSE event
  const eventData = JSON.stringify(data);
  res.write(`data: ${eventData}\n\n`);
}
