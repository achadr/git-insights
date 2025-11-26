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
  apiKey: Joi.string().optional().allow(null),
  fileLimit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.base': 'fileLimit must be a number',
      'number.integer': 'fileLimit must be an integer',
      'number.min': 'fileLimit must be at least 1',
      'number.max': 'fileLimit cannot exceed 50'
    }),
  filePaths: Joi.array()
    .items(Joi.string())
    .max(50)
    .optional()
    .messages({
      'array.base': 'filePaths must be an array',
      'array.max': 'Cannot analyze more than 50 files at once'
    })
});

const filesSchema = Joi.object({
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
  // For /files endpoint, use simpler schema
  const schemaToUse = req.path === '/files' ? filesSchema : schema;
  const { error } = schemaToUse.validate(req.body);

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
