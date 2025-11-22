// server/src/models/prisma.js
import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient in dev (prevents many connections on hot reload)
const globalForPrisma = globalThis;

// Keep the named export `prisma` (matches the rest of your code)
let prisma = globalForPrisma.__prisma;

if (!prisma) {
  prisma = new PrismaClient();
  // only stash on global in dev; in prod the module cache is enough
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = prisma;
  }
}

export { prisma };
