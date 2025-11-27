// server/src/middleware/auth.middleware.js - JWT Authentication Middleware

import { verifyToken } from '../services/auth.service.js';

/**
 * Middleware to verify a JWT token from the Authorization header (Bearer scheme).
 * Attaches decoded admin data to req.admin if valid.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // 1. Check for header presence
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'No token provided' 
    });
  }

  const token = authHeader.substring(7); // Extract token after "Bearer "
  
  // 2. Verify token validity
  try {
    const decoded = verifyToken(token);
    req.admin = decoded; // Attach admin payload to request
    next(); // Proceed to route handler
  } catch (error) {
    // Handle JWT signature errors or expiration errors
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Invalid or expired token' 
    });
  }
}