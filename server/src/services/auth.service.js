// server/src/services/auth.service.js - Core Authentication Logic

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/prisma.js';

// --- Constants ---
// JWT_SECRET is mandatory for security; removed fallback and rely on server check (in app.js)
const JWT_SECRET = process.env.JWT_SECRET; 
const JWT_EXPIRES_IN = '7d';

// --- Public Service Functions ---

/** Registers a new administrator. */
export async function registerAdmin({ email, password, name }) {
  // 1. Check if admin already exists
  const existing = await prisma.admin.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error('Admin with this email already exists');
  }

  // 2. Hash password with bcrypt (CRITICAL SECURITY STEP)
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 3. Create admin in database
  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  });

  // 4. Return secure admin details (without password hash)
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name
  };
}

/** Logs in an admin and generates a JWT token. */
export async function loginAdmin({ email, password }) {
  // 1. Find admin by email
  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  // 2. Verify password (CRITICAL SECURITY STEP)
  const isValid = await bcrypt.compare(password, admin.password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 3. Generate JWT token
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  };
}

/** Verifies the authenticity and validity of a JWT token. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Re-throw generic error if verification fails (e.g., signature mismatch, expired)
    throw new Error('Invalid or expired token');
  }
}