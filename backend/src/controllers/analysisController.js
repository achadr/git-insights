import analyzerService from '../services/analyzerService.js';
import logger from '../utils/logger.js';

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
