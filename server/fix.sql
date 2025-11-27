DROP INDEX IF EXISTS "attendees_stripeSessionId_key";
   DROP INDEX IF EXISTS "Attendee_stripeSessionId_key";
   DROP INDEX IF EXISTS "attendees_stripeSessionId_idx";
   ALTER TABLE "attendees" ALTER COLUMN "stripeSessionId" DROP NOT NULL;
   CREATE UNIQUE INDEX "attendees_stripeSessionId_unique" ON "attendees"("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;