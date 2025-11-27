// server/src/routes/password-reset.routes.js - Admin Password Reset Flow

import { Router } from 'express';
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} from '../services/password-reset.service.js';
import { loginRateLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = Router();

// POST /api/password-reset/request - Initiate reset process (send email)
router.post(
  '/request',
  loginRateLimiter, // Rate limit requests to prevent enumeration
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Email is required'
      });
    }

    const result = await requestPasswordReset(email);
    res.json(result);
  })
);

// POST /api/password-reset/reset - Set new password using a valid token
router.post(
  '/reset',
  loginRateLimiter, // Apply rate limit to reset attempts
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Token and new password are required'
      });
    }

    const result = await resetPassword(token, newPassword);
    res.json(result);
  })
);

// GET /api/password-reset/verify/:token - Check if the token is valid (used by client)
router.get(
  '/verify/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await verifyResetToken(token);
    res.json(result);
  })
);

export default router;