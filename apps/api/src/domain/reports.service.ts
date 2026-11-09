import { Injectable } from "@nestjs/common";
import type { OwnerRequest } from "../auth/session";
import type { DTO } from "../http/contracts";
import {
  dbDate,
  dateString,
  occupiedMinutes,
  shift,
  today,
  wallInstant,
  weekBounds,
} from "../time/calendar";
import { Mutations } from "./mutations";
import { ReadingService } from "./reading.service";
import { ScheduleService } from "./schedule.service";
import { saturday, SettingsService } from "./settings.service";
import {
  taskDto,
  occurrenceDto,
  seriesDto,
  fixedDto,
  exceptionDto,
  bookDto,
  readingDto,
  goalDto,
} from "./mappers";
@Injectable()
export class ReportsService {
  constructor(
    private readonly mutations: Mutations,
    private readonly reading: ReadingService,
    private readonly schedule: ScheduleService,
    private readonly settings: SettingsService,
  ) {}
  weekly(req: OwnerRequest, week: string) {
    saturday(week);
    const bounds = weekBounds(week);
    return this.mutations.run(
      req,
      "reports.weekly",
      { week },
      async (tx, revision): Promise<DTO["WeeklyReport"]> => {
        const schedule = await this.schedule.read(
          tx,
          req.owner.id,
          bounds.startAt.toISOString(),
          bounds.endAt.toISOString(),
          revision,
        );
        const actualReading = await this.reading.totals(
          tx,
          req.owner.id,
          bounds.startAt,
          bounds.endAt,
        );
        const goal = await this.reading.goal(tx, req.owner.id, week);
        const priorities = await tx.dailyPriority.findMany({
          where: {
            ownerId: req.owner.id,
            localDate: { gte: dbDate(week), lt: dbDate(shift(week, 7)) },
            occurrence: { canceledAt: null, task: { deletedAt: null } },
          },
          include: { occurrence: true },
        });
        const tasks = new Map(
          schedule.events
            .filter(
              (e) =>
                e.kind === "task" &&
                new Date(e.startAt) >= bounds.startAt &&
                new Date(e.startAt) < bounds.endAt,
            )
            .map((e) => [e.id, e.status]),
        );
        for (const p of priorities)
          tasks.set(p.occurrenceId, p.occurrence.status);
        const unscheduledCompletedTaskCount = await tx.taskOccurrence.count({
          where: {
            task: { ownerId: req.owner.id, deletedAt: null },
            canceledAt: null,
            scheduledStartAt: null,
            status: "completed",
            completedAt: { gte: bounds.startAt, lt: bounds.endAt },
            id: { notIn: [...tasks.keys()] },
          },
        });
        const completedTaskCount = [...tasks.values()].filter(
          (value) => value === "completed",
        ).length;
        const dailyReading: DTO["WeeklyReport"]["dailyReading"] = [];
        for (let i = 0; i < 7; i++) {
          const day = shift(week, i);
          dailyReading.push({
            localDate: day,
            ...(await this.reading.totals(
              tx,
              req.owner.id,
              wallInstant(day, "00:00"),
              wallInstant(shift(day, 1), "00:00"),
            )),
          });
        }
        return {
          weekStart: week,
          from: bounds.startAt.toISOString(),
          to: bounds.endAt.toISOString(),
          inProgress: today() >= week && today() < shift(week, 7),
          eventCount: schedule.events.length,
          plannedTaskCount: tasks.size,
          completedTaskCount,
          remainingTaskCount: tasks.size - completedTaskCount,
          unscheduledCompletedTaskCount,
          occupiedMinutes: occupiedMinutes(
            schedule.events.map((e) => ({
              startAt: new Date(e.startAt),
              endAt: new Date(e.endAt),
            })),
            bounds,
          ),
          plannedReadingMinutes: schedule.days.reduce(
            (sum, day) => sum + day.plannedReadingMinutes,
            0,
          ),
          actualReading,
          goal,
          days: schedule.days,
          dailyReading,
        };
      },
    );
  }
  export(req: OwnerRequest) {
    return this.mutations.run(
      req,
      "export",
      {},
      async (tx): Promise<DTO["Export"]> => {
        const ownerId = req.owner.id;
        const tasks = await tx.task.findMany({
          where: { ownerId },
          include: {
            occurrences: { where: { seriesId: null } },
            series: { select: { id: true } },
          },
        });
        const occurrences = await tx.taskOccurrence.findMany({
          where: { task: { ownerId } },
        });
        const series = await tx.taskSeries.findMany({
          where: { root: { ownerId } },
        });
        const fixed = await tx.fixedSeries.findMany({
          where: { root: { ownerId } },
        });
        const exceptions = await tx.occurrenceException.findMany({
          where: { root: { ownerId } },
        });
        const books = await tx.book.findMany({ where: { ownerId } });
        const readings = await tx.readingSession.findMany({
          where: { ownerId },
        });
        const goals = await tx.weeklyGoal.findMany({ where: { ownerId } });
        const priorities = await tx.dailyPriority.findMany({
          where: { ownerId },
          orderBy: [{ localDate: "asc" }, { position: "asc" }],
        });
        const settings = await this.settings.read(ownerId, tx);
        const revision = (
          await tx.userSettings.findUniqueOrThrow({ where: { ownerId } })
        ).prioritiesVersion;
        const dates = [
          ...new Set(priorities.map((row) => dateString(row.localDate))),
        ];
        return {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          timezone: "Asia/Tehran",
          tasks: tasks.map(taskDto),
          taskOccurrences: occurrences.map(occurrenceDto),
          taskSeries: series.map(seriesDto),
          fixedSeries: fixed.map(fixedDto),
          exceptions: exceptions.map(exceptionDto),
          books: books.map(bookDto),
          readingSessions: readings.map(readingDto),
          weeklyGoals: goals.map(goalDto),
          dailyPriorities: dates.map((day) => ({
            localDate: day,
            version: revision,
            occurrenceIds: priorities
              .filter((row) => dateString(row.localDate) === day)
              .map((row) => row.occurrenceId),
          })),
          settings,
        };
      },
    );
  }
}
