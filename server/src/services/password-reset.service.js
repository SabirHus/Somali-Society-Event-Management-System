// server/src/services/password-reset.service.js - Logic for Admin Password Reset Flow

import { prisma } from '../models/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './email.service.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../middleware/error-handler.js';

/** Initiates the password reset process by generating a token and sending an email. */
export async function requestPasswordReset(email) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    // Security practice: Always return a success message even if the email doesn't exist 
    // to prevent user enumeration attacks.
    if (!admin) {
      logger.warn('Password reset requested for non-existent email', { email });
      return { success: true, message: 'If an account exists, a reset email will be sent' };
    }

    // Generate secure token and expiry time (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    // Store token and expiry in database
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    // Delegate email sending
    await sendPasswordResetEmail({
      email: admin.email,
      name: admin.name,
      resetUrl
    });

    logger.info('Password reset email sent', {
      email: admin.email,
      adminId: admin.id
    });

    return {
      success: true,
      message: 'If an account exists, a reset email will be sent'
    };
  } catch (error) {
    logger.error('Password reset request failed', {
      error: error.message,
      email
    });
    throw error;
  }
}

/** Executes the password reset if the provided token is valid. */
export async function resetPassword(token, newPassword) {
  try {
    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // 1. Find admin by valid, non-expired token
    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must be greater than current time
        }
      }
    });

    if (!admin) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update password and invalidate reset token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    logger.info('Password reset successful', {
      adminId: admin.id,
      email: admin.email
    });

    return {
      success: true,
      message: 'Password reset successful'
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logger.error('Password reset failed', {
      error: error.message
    });
    throw error;
  }
}

/** Verifies if a password reset token is currently valid and unexpired. */
export async function verifyResetToken(token) {
  try {
    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!admin) {
      return { valid: false };
    }

    return {
      valid: true,
      admin: {
        email: admin.email,
        name: admin.name
      }
    };
  } catch (error) {
    logger.error('Token verification failed', {
      error: error.message
    });
    throw error;
  }
}