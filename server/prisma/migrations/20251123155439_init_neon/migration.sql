-- server/prisma/migrations/20251123155439_init_neon/migration.sql

-- Initial database setup with Admin and Attendee tables.
-- NOTE: Uses initial structure before Event entity was fully integrated.

-- CreateTable: Admin (Initial)
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key" PRIMARY KEY ("id")
);

-- CreateTable: Attendee (Initial)
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "code" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique index on Admin email
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex: Unique index on Attendee code
CREATE UNIQUE INDEX "Attendee_code_key" ON "Attendee"("code");

-- CreateIndex: Unique index on Stripe session ID (initial version)
CREATE UNIQUE INDEX "Attendee_stripeSessionId_key" ON "Attendee"("stripeSessionId");