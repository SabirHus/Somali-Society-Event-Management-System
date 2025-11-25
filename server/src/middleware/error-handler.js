// server/src/middleware/error-handler.js - NEW FILE
import logger from '../utils/logger.js';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else if (err.code?.startsWith('P')) {
    logger.error('Prisma error', {
      code: err.code,
      message: err.message,
      meta: err.meta
    });
    message = 'Database error occurred';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Handle Stripe errors
  if (err.type === 'StripeCardError') {
    statusCode = 400;
    message = 'Payment failed: ' + err.message;
  } else if (err.type?.includes('Stripe')) {
    logger.error('Stripe error', {
      type: err.type,
      message: err.message,
      code: err.code
    });
    message = 'Payment processing error';
  }

  // Log errors (except operational errors like 404)
  if (!err.isOperational || statusCode >= 500) {
    logger.error('Error occurred', {
      error: {
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode
      },
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  }

  // Send error response
  const response = {
    error: message,
    ...(err.errors && { details: err.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      code: err.code
    })
  };

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;