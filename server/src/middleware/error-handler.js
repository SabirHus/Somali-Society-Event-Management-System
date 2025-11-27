// server/src/middleware/error-handler.js - Centralized Error Handling

import logger from '../utils/logger.js';

// --- Custom Error Classes (Models) ---

/** Base class for custom application errors. */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Used to distinguish programming errors from expected operational errors (e.g., 404, validation)
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Error for invalid request data (400). */
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors; // Array to hold specific field validation errors
  }
}

/** Error for authentication failures (401). */
export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/** Error for resource not found (404). */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

// --- Middleware ---

/** Centralized error handling middleware. */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // 1. Handle specific Database Errors (Prisma)
  if (err.code === 'P2002') {
    statusCode = 409; // Conflict
    message = 'A record with this value already exists';
  } else if (err.code === 'P2025') {
    statusCode = 404; // Not Found
    message = 'Record not found';
  } else if (err.code?.startsWith('P')) {
    // Catch-all for other Prisma errors
    logger.error('Prisma error', {
      code: err.code,
      message: err.message,
      meta: err.meta
    });
    message = 'Database error occurred';
    statusCode = 500;
  }

  // 2. Handle Authentication Errors (JWT)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // 3. Handle External Service Errors (Stripe)
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
    statusCode = 500;
  }

  // 4. Logging: Log all internal errors and non-operational errors
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

  // 5. Send error response
  const response = {
    error: message,
    // Include validation details if available
    ...(err.errors && { details: err.errors }), 
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      code: err.code
    })
  };

  res.status(statusCode).json(response);
}

/** Utility wrapper to handle async errors in Express routes. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};