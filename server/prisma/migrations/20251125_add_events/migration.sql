-- server/prisma/migrations/20251125_add_events/migration.sql

-- Add Events System Migration and update existing tables (Admin, Attendee)

-- ============================================
-- 1. CREATE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 2. RENAME TABLES (Standardizing to plural snake_case)
-- ============================================
-- Rename Admin to admins
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Admin') THEN
        ALTER TABLE "Admin" RENAME TO "admins";
    END IF;
END $$;

-- Rename Attendee to attendees
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Attendee') THEN
        ALTER TABLE "Attendee" RENAME TO "attendees";
    END IF;
END $$;

-- Rename primary key constraint for admins
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'key') THEN
        ALTER TABLE "admins" RENAME CONSTRAINT "key" TO "admins_pkey";
    END IF;
END $$;

-- Rename primary key constraint for attendees
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendee_pkey') THEN
        ALTER TABLE "attendees" RENAME CONSTRAINT "Attendee_pkey" TO "attendees_pkey";
    END IF;
END $$;

-- ============================================
-- 3. UPDATE ADMINS TABLE (Add Password Reset Fields)
-- ============================================
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- ============================================
-- 4. UPDATE ATTENDEES TABLE (Add eventId and cleanup old columns)
-- ============================================
-- Add foreign key column
ALTER TABLE "attendees" ADD COLUMN IF NOT EXISTS "eventId" TEXT;

-- Add standard updatedAt column
ALTER TABLE "attendees" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove old columns that are no longer needed after event integration
ALTER TABLE "attendees" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "attendees" DROP COLUMN IF EXISTS "status";

-- ============================================
-- 5. ADD FOREIGN KEY CONSTRAINT
-- ============================================
-- Link attendees to events with cascade delete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'attendees_eventId_fkey'
    ) THEN
        ALTER TABLE "attendees" 
        ADD CONSTRAINT "attendees_eventId_fkey" 
        FOREIGN KEY ("eventId") 
        REFERENCES "events"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 6. CREATE INDEXES
-- ============================================
-- Index on eventId for fast lookups
CREATE INDEX IF NOT EXISTS "attendees_eventId_idx" ON "attendees"("eventId");

-- Index on email for searching
CREATE INDEX IF NOT EXISTS "attendees_email_idx" ON "attendees"("email");

-- ============================================
-- 7. UPDATE EXISTING UNIQUE CONSTRAINTS (Renaming)
-- ============================================
-- Rename unique constraint on code
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendee_code_key') THEN
        ALTER INDEX "Attendee_code_key" RENAME TO "attendees_code_key";
    END IF;
END $$;

-- Rename unique constraint on stripeSessionId
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendee_stripeSessionId_key') THEN
        ALTER INDEX "Attendee_stripeSessionId_key" RENAME TO "attendees_stripeSessionId_key";
    END IF;
END $$;

-- Rename unique constraint on admin email
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admin_email_key') THEN
        ALTER INDEX "Admin_email_key" RENAME TO "admins_email_key";
    END IF;
END $$;