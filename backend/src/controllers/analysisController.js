import analyzerService from '../services/analyzerService.js';
import logger from '../utils/logger.js';

export const analyzeRepository = async (req, res, next) => {
  try {
    const { repoUrl, apiKey, fileLimit = 10 } = req.body;

    logger.info('Analysis requested', { repoUrl, fileLimit });

    const result = await analyzerService.analyzeRepository(repoUrl, apiKey, fileLimit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    next(error);
  }
};
