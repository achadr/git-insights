const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.message.toLowerCase().includes('not found')) {
    return res.status(404).json({
      success: false,
      error: {
        message: err.message,
        code: 'NOT_FOUND'
      }
    });
  }

  if (err.message.toLowerCase().includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: {
        message: err.message,
        code: 'RATE_LIMIT'
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
};

export default errorHandler;
