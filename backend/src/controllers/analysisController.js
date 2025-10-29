import analyzerService from '../services/analyzerService.js';
import logger from '../utils/logger.js';

export const analyzeRepository = async (req, res, next) => {
  try {
    const { repoUrl, apiKey } = req.body;

    logger.info('Analysis requested', { repoUrl });

    const result = await analyzerService.analyzeRepository(repoUrl, apiKey);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    next(error);
  }
};
