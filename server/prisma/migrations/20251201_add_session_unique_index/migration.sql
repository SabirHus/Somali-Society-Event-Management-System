CREATE UNIQUE INDEX IF NOT EXISTS "attendees_stripeSessionId_unique"
ON "attendees"("stripeSessionId")
WHERE "stripeSessionId" IS NOT NULL;