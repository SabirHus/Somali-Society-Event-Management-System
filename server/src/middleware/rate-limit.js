// server/src/middleware/rate-limit.js - Rate Limiting Configuration

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// --- General Rate Limiter ---
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: { 
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded (General)', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// --- Login Rate Limiter (Stricter) ---
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Only count failed logins against the limit
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      error: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// --- Checkout Rate Limiter ---
export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 checkout sessions per hour
  message: {
    error: 'Too many checkout attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    logger.warn('Checkout rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      error: 'Too many checkout attempts. Please try again in an hour.',
      retryAfter: '1 hour'
    });
  }
});

// --- Admin Actions Rate Limiter ---
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 admin requests per window
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    logger.warn('Admin rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many admin requests. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Export all limiters for routing files
export default {
  rateLimiter,
  loginRateLimiter,
  checkoutRateLimiter,
  adminRateLimiter
};