'use strict';

const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload.',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'Image must be 5MB or smaller.' },
    });
  }

  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'Resource already exists.' },
    });
  }

  logger.error('Unhandled error:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  });
}

module.exports = errorHandler;
