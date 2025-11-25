// server/src/routes/auth.routes.js
import express from 'express';
import { registerAdmin, loginAdmin } from '../services/auth.service.js';
import { adminList, adminToggle } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'validation_error',
        message: 'Email, password and name are required' 
      });
    }

    const admin = await registerAdmin({ email, password, name });
    res.json({ 
      success: true, 
      admin 
    });
  } catch (err) {
    if (err.message === 'Admin with this email already exists') {
      return res.status(409).json({ 
        error: 'admin_exists',
        message: err.message 
      });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'validation_error',
        message: 'Email and password are required' 
      });
    }

    const result = await loginAdmin({ email, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ 
      error: 'invalid_credentials',
      message: err.message 
    });
  }
});

router.get('/attendees', adminList);
router.post('/toggle-checkin', adminToggle);

export default router;