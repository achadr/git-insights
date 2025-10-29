import Joi from 'joi';

const schema = Joi.object({
  repoUrl: Joi.string()
    .uri()
    .pattern(/github\.com/)
    .required()
    .messages({
      'string.pattern.base': 'URL must be a valid GitHub repository URL',
      'string.uri': 'Must be a valid URL',
      'any.required': 'Repository URL is required'
    }),
  apiKey: Joi.string().optional().allow(null)
});

export const validateRepoUrl = (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      }
    });
  }

  next();
};
