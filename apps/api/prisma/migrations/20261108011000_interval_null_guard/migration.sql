ALTER TABLE "TaskOccurrence" DROP CONSTRAINT "Occurrence_interval";
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "Occurrence_interval" CHECK (
  ("scheduledStartAt" IS NULL AND "scheduledEndAt" IS NULL) OR
  ("scheduledStartAt" IS NOT NULL AND "scheduledEndAt" IS NOT NULL AND "scheduledEndAt" > "scheduledStartAt")
);
