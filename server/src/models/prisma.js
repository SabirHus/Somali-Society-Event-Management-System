// server/src/models/prisma.js - Centralized Prisma Client Initialization

import { PrismaClient } from '@prisma/client';

// Use a global variable to persist the PrismaClient across hot-reloads in development
const globalForPrisma = globalThis;

// Initialize the Prisma Client globally (if not already initialized)
let prisma = globalForPrisma.__prisma;

if (!prisma) {
  prisma = new PrismaClient({
    // Optional: add logging/debug settings here if needed
  });
  
  // Only expose the instance globally in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = prisma;
  }
}

// Export the single, reusable Prisma client instance
export { prisma };