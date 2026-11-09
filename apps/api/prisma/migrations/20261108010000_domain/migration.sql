-- CreateEnum
CREATE TYPE "Category" AS ENUM ('personal', 'reading', 'work', 'university', 'other');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "Completion" AS ENUM ('incomplete', 'completed');

-- CreateEnum
CREATE TYPE "FixedKind" AS ENUM ('work', 'class');

-- CreateEnum
CREATE TYPE "ExceptionKind" AS ENUM ('cancel', 'override');

-- CreateEnum
CREATE TYPE "GoalUnit" AS ENUM ('minutes', 'pages', 'sessions');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('reading', 'finished', 'archived');

-- CreateTable
CREATE TABLE "Owner" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sessionGeneration" INTEGER NOT NULL DEFAULT 0,
    "scheduleRevision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "ownerId" UUID NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 6,
    "workEffectiveFrom" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "prioritiesVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("ownerId")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000),
    "category" "Category" NOT NULL DEFAULT 'personal',
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "estimateMinutes" INTEGER,
    "dueDate" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesRoot" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "bootstrapKey" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesRoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSeries" (
    "id" UUID NOT NULL,
    "rootSeriesId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "template" JSONB NOT NULL,
    "weekdays" INTEGER[],
    "localStartTime" VARCHAR(5) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "TaskSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOccurrence" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "seriesId" UUID,
    "occurrenceKey" TEXT NOT NULL,
    "originalLocalDate" DATE,
    "scheduledStartAt" TIMESTAMPTZ(3),
    "scheduledEndAt" TIMESTAMPTZ(3),
    "status" "Completion" NOT NULL DEFAULT 'incomplete',
    "completedAt" TIMESTAMPTZ(3),
    "canceledAt" TIMESTAMPTZ(3),
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "snapshot" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TaskOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedSeries" (
    "id" UUID NOT NULL,
    "rootSeriesId" UUID NOT NULL,
    "kind" "FixedKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "notes" VARCHAR(5000),
    "location" VARCHAR(200),
    "weekdays" INTEGER[],
    "localStartTime" VARCHAR(5) NOT NULL,
    "localEndTime" VARCHAR(5) NOT NULL,
    "endsNextDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "everyWeeks" INTEGER NOT NULL DEFAULT 1,
    "anchorWeekStart" DATE,
    "parity" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FixedSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccurrenceException" (
    "id" UUID NOT NULL,
    "rootSeriesId" UUID NOT NULL,
    "originalLocalDate" DATE NOT NULL,
    "kind" "ExceptionKind" NOT NULL,
    "title" VARCHAR(200),
    "startAt" TIMESTAMPTZ(3),
    "endAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OccurrenceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "author" VARCHAR(200),
    "description" VARCHAR(5000),
    "totalPages" INTEGER,
    "currentPage" INTEGER,
    "status" "BookStatus" NOT NULL DEFAULT 'reading',
    "deletedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "pages" INTEGER,
    "bookId" UUID,
    "bookTitleSnapshot" VARCHAR(200),
    "occurrenceId" UUID,
    "topic" VARCHAR(200),
    "note" VARCHAR(5000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyGoal" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "weekStart" DATE NOT NULL,
    "unit" "GoalUnit" NOT NULL,
    "target" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultGoal" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "effectiveFromWeek" DATE NOT NULL,
    "unit" "GoalUnit" NOT NULL,
    "target" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DefaultGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPriority" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "occurrenceId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "DailyPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "operation" VARCHAR(200) NOT NULL,
    "key" UUID NOT NULL,
    "requestDigest" VARCHAR(64) NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_singleton_key" ON "Owner"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE INDEX "session_expire_idx" ON "session"("expire");

-- CreateIndex
CREATE INDEX "Task_ownerId_createdAt_id_idx" ON "Task"("ownerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Task_ownerId_dueDate_idx" ON "Task"("ownerId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesRoot_ownerId_bootstrapKey_key" ON "SeriesRoot"("ownerId", "bootstrapKey");

-- CreateIndex
CREATE INDEX "TaskSeries_taskId_effectiveFrom_idx" ON "TaskSeries"("taskId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSeries_rootSeriesId_effectiveFrom_key" ON "TaskSeries"("rootSeriesId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOccurrence_occurrenceKey_key" ON "TaskOccurrence"("occurrenceKey");

-- CreateIndex
CREATE INDEX "TaskOccurrence_scheduledStartAt_scheduledEndAt_idx" ON "TaskOccurrence"("scheduledStartAt", "scheduledEndAt");

-- CreateIndex
CREATE INDEX "TaskOccurrence_taskId_status_idx" ON "TaskOccurrence"("taskId", "status");

-- CreateIndex
CREATE INDEX "TaskOccurrence_completedAt_idx" ON "TaskOccurrence"("completedAt");

-- CreateIndex
CREATE INDEX "FixedSeries_effectiveFrom_effectiveUntil_idx" ON "FixedSeries"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "FixedSeries_rootSeriesId_effectiveFrom_key" ON "FixedSeries"("rootSeriesId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "OccurrenceException_startAt_endAt_idx" ON "OccurrenceException"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceException_rootSeriesId_originalLocalDate_key" ON "OccurrenceException"("rootSeriesId", "originalLocalDate");

-- CreateIndex
CREATE INDEX "Book_ownerId_createdAt_id_idx" ON "Book"("ownerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ReadingSession_ownerId_startAt_id_idx" ON "ReadingSession"("ownerId", "startAt", "id");

-- CreateIndex
CREATE INDEX "ReadingSession_ownerId_endAt_idx" ON "ReadingSession"("ownerId", "endAt");

-- CreateIndex
CREATE INDEX "ReadingSession_bookId_startAt_idx" ON "ReadingSession"("bookId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyGoal_ownerId_weekStart_key" ON "WeeklyGoal"("ownerId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultGoal_ownerId_effectiveFromWeek_key" ON "DefaultGoal"("ownerId", "effectiveFromWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPriority_ownerId_localDate_position_key" ON "DailyPriority"("ownerId", "localDate", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPriority_ownerId_localDate_occurrenceId_key" ON "DailyPriority"("ownerId", "localDate", "occurrenceId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_ownerId_operation_key_key" ON "IdempotencyRecord"("ownerId", "operation", "key");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesRoot" ADD CONSTRAINT "SeriesRoot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSeries" ADD CONSTRAINT "TaskSeries_rootSeriesId_fkey" FOREIGN KEY ("rootSeriesId") REFERENCES "SeriesRoot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSeries" ADD CONSTRAINT "TaskSeries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "TaskSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSeries" ADD CONSTRAINT "FixedSeries_rootSeriesId_fkey" FOREIGN KEY ("rootSeriesId") REFERENCES "SeriesRoot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceException" ADD CONSTRAINT "OccurrenceException_rootSeriesId_fkey" FOREIGN KEY ("rootSeriesId") REFERENCES "SeriesRoot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultGoal" ADD CONSTRAINT "DefaultGoal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPriority" ADD CONSTRAINT "DailyPriority_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPriority" ADD CONSTRAINT "DailyPriority_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants not expressible in Prisma's declarative schema.
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_singleton_true" CHECK (singleton = true);
ALTER TABLE "UserSettings" ADD CONSTRAINT "Settings_timezone_week" CHECK (timezone = 'Asia/Tehran' AND "weekStartsOn" = 6);
ALTER TABLE "Task" ADD CONSTRAINT "Task_title_estimate" CHECK (length(trim(title)) > 0 AND ("estimateMinutes" IS NULL OR "estimateMinutes" BETWEEN 1 AND 1440));
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "Occurrence_interval" CHECK (("scheduledStartAt" IS NULL AND "scheduledEndAt" IS NULL) OR ("scheduledStartAt" IS NOT NULL AND "scheduledEndAt" > "scheduledStartAt"));
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "Occurrence_completion" CHECK ((status = 'incomplete' AND "completedAt" IS NULL) OR (status = 'completed' AND "completedAt" IS NOT NULL));
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "Occurrence_series_date" CHECK (("seriesId" IS NULL AND "originalLocalDate" IS NULL) OR ("seriesId" IS NOT NULL AND "originalLocalDate" IS NOT NULL));
CREATE UNIQUE INDEX "Occurrence_one_off_task" ON "TaskOccurrence" ("taskId") WHERE "seriesId" IS NULL;
ALTER TABLE "TaskSeries" ADD CONSTRAINT "TaskSeries_rule" CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[1,2,3,4,5,6,7] AND "localStartTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "durationMinutes" BETWEEN 1 AND 1440 AND ("effectiveUntil" IS NULL OR "effectiveUntil" >= "effectiveFrom"));
ALTER TABLE "FixedSeries" ADD CONSTRAINT "FixedSeries_rule" CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[1,2,3,4,5,6,7] AND "localStartTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "localEndTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND ("endsNextDay" OR "localEndTime" > "localStartTime") AND ("effectiveUntil" IS NULL OR "effectiveUntil" >= "effectiveFrom") AND (("everyWeeks" = 1 AND "anchorWeekStart" IS NULL AND parity IS NULL) OR ("everyWeeks" = 2 AND "anchorWeekStart" IS NOT NULL AND extract(isodow FROM "anchorWeekStart") = 6 AND parity IS NOT NULL AND parity IN (0,1))));
ALTER TABLE "OccurrenceException" ADD CONSTRAINT "Exception_interval" CHECK ((kind = 'cancel' AND "startAt" IS NULL AND "endAt" IS NULL) OR (kind = 'override' AND "startAt" IS NOT NULL AND "endAt" IS NOT NULL AND "endAt" > "startAt"));
ALTER TABLE "Book" ADD CONSTRAINT "Book_pages" CHECK (length(trim(title)) > 0 AND ("totalPages" IS NULL OR "totalPages" > 0) AND ("currentPage" IS NULL OR "currentPage" > 0) AND ("currentPage" IS NULL OR "totalPages" IS NULL OR "currentPage" <= "totalPages"));
ALTER TABLE "ReadingSession" ADD CONSTRAINT "Reading_interval_pages" CHECK ("endAt" > "startAt" AND "endAt" - "startAt" <= interval '24 hours' AND (pages IS NULL OR pages > 0));
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_positive_saturday" CHECK (target > 0 AND extract(isodow FROM "weekStart") = 6);
ALTER TABLE "DefaultGoal" ADD CONSTRAINT "DefaultGoal_positive_saturday" CHECK (target > 0 AND extract(isodow FROM "effectiveFromWeek") = 6);
ALTER TABLE "DailyPriority" ADD CONSTRAINT "Priority_position" CHECK (position BETWEEN 1 AND 3);
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "Idempotency_retention" CHECK ("expiresAt" >= "createdAt" + interval '24 hours');
