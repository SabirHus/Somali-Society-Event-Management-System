// server/src/routes/auth.routes.js - COMPLETE REPLACEMENT
import express from 'express';
import { registerAdmin, loginAdmin } from '../services/auth.service.js';
import { adminList, adminToggle } from '../controllers/admin.controller.js';
import { loginRateLimiter, adminRateLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = express.Router();

// POST /api/auth/register - Register new admin
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ 
      error: 'validation_error',
      message: 'Email, password and name are required' 
    });
  }

  try {
    const admin = await registerAdmin({ email, password, name });
    res.json({ 
      success: true, 
      message: 'Admin registered successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (err) {
    if (err.message === 'Admin with this email already exists') {
      return res.status(409).json({ 
        error: 'admin_exists',
        message: err.message 
      });
    }
    throw err;
  }
}));

// POST /api/auth/login - Admin login (rate limited)
router.post(
  '/login', 
  loginRateLimiter, // Limit: 5 attempts per 15 minutes
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'validation_error',
        message: 'Email and password are required' 
      });
    }

    try {
      const result = await loginAdmin({ email, password });
      res.json(result);
    } catch (err) {
      // Generic error - don't reveal if user exists
      res.status(401).json({ 
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }
  })
);

// GET /api/auth/attendees - List attendees (protected)
router.get(
  '/attendees',
  adminRateLimiter, // Limit: 50 requests per 15 minutes
  asyncHandler(adminList)
);

// POST /api/auth/toggle-checkin - Toggle check-in (protected)
router.post(
  '/toggle-checkin',
  adminRateLimiter,
  asyncHandler(adminToggle)
);

export default router;