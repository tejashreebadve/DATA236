const { validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 * Should be used after express-validator rules
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: errors.array(),
      },
    });
  }

  next();
};

module.exports = {
  validate,
};

