// server/src/routes/auth.routes.js - COMPLETE REPLACEMENT
import express from 'express';
import { prisma } from '../models/prisma.js';
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

// POST /api/auth/attendees/:code/checkin - Check in by code
router.post(
  '/attendees/:code/checkin',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const { toggleCheckInByCode } = await import('../services/attendee.service.js');
    const attendee = await toggleCheckInByCode(req.params.code);
    res.json({
      success: true,
      message: attendee.checkedIn ? 'Checked in successfully' : 'Check-in removed',
      attendee
    });
  })
);

// DELETE /api/auth/attendees/:id - Delete attendee
router.delete(
  '/attendees/:id',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const attendeeId = req.params.id;
    
    console.log('Attempting to delete attendee:', attendeeId);
    
    try {
      // Check if attendee exists
      const existingAttendee = await prisma.attendee.findUnique({
        where: { id: attendeeId }
      });

      if (!existingAttendee) {
        return res.status(404).json({
          success: false,
          message: 'Attendee not found'
        });
      }

      // Delete the attendee
      await prisma.attendee.delete({
        where: { id: attendeeId }
      });
      
      console.log('Attendee deleted successfully:', attendeeId);
      
      res.json({
        success: true,
        message: 'Attendee deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete attendee error:', error);
      res.status(500).json({
        success: false,
        message: `Failed to delete attendee: ${error.message}`
      });
    }
  })
);

// DELETE /api/auth/events/:id - Delete event (FORCE DELETE)
router.delete(
  '/events/:id',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    
    console.log('Attempting to delete event:', eventId);
    
    try {
      // Get event with attendee count
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { attendees: true }
          }
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      console.log('Event found:', event.name, 'Attendees:', event._count.attendees);

      // FORCE DELETE: Delete all attendees first, then delete event
      if (event._count.attendees > 0) {
        // Delete all attendees for this event
        const deletedAttendees = await prisma.attendee.deleteMany({
          where: { eventId: eventId }
        });
        
        console.log(`Deleted ${deletedAttendees.count} attendees`);
      }

      // Now delete the event
      await prisma.event.delete({
        where: { id: eventId }
      });

      console.log('Event permanently deleted');

      res.json({
        success: true,
        message: 'Event and all attendees permanently deleted',
        deletedAttendees: event._count.attendees
      });
      
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: `Failed to delete event: ${error.message}`
      });
    }
  })
);

// GET /api/auth/attendees/:id - Get single attendee
router.get(
  '/attendees/:id',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const attendee = await prisma.attendee.findUnique({
      where: { id: req.params.id },
      include: {
        event: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found'
      });
    }

    res.json(attendee);
  })
);

// PUT /api/auth/attendees/:id - Update attendee
router.put(
  '/attendees/:id',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, phone, checkedIn } = req.body;

    const attendee = await prisma.attendee.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(checkedIn !== undefined && { checkedIn })
      },
      include: {
        event: true
      }
    });

    res.json({
      success: true,
      message: 'Attendee updated successfully',
      attendee
    });
  })
);

// PUT /api/auth/events/:id - Update event
router.put(
  '/events/:id',
  adminRateLimiter,
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const { name, description, location, eventDate, eventTime, price, capacity } = req.body;
    
    try {
      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(location && { location }),
          ...(eventDate && { eventDate: new Date(eventDate) }),
          ...(eventTime && { eventTime }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(capacity !== undefined && { capacity: parseInt(capacity) })
        }
      });
      
      res.json({
        success: true,
        message: 'Event updated successfully',
        event
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: `Failed to update event: ${error.message}`
      });
    }
  })
);

export default router;