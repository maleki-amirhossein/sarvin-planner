import type {
  Task,
  TaskOccurrence,
  FixedSeries,
  TaskSeries,
  OccurrenceException,
  Book,
  ReadingSession,
  WeeklyGoal,
} from "../generated/prisma/client";
import type { DTO } from "../http/contracts";
import { dateString } from "../time/calendar";
const iso = (value: Date | null) => value?.toISOString() ?? null;
const local = (value: Date | null) => (value ? dateString(value) : null);
const audit = (v: {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: v.id,
  version: v.version,
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString(),
});
export function taskDto(
  task: Task & {
    occurrences: TaskOccurrence[];
    series: Pick<TaskSeries, "id">[];
  },
): DTO["Task"] {
  const one = task.occurrences.find((v) => v.seriesId === null);
  const recurring = task.series.length > 0;
  return {
    ...audit(task),
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    estimateMinutes: task.estimateMinutes,
    dueDate: local(task.dueDate),
    deletedAt: iso(task.deletedAt),
    recurring,
    oneOffOccurrenceId: recurring ? null : one!.id,
    status: recurring ? null : one!.status,
  };
}
export function occurrenceDto(
  v: TaskOccurrence,
): DTO["ScheduledTaskOccurrence"] {
  return {
    ...audit(v),
    taskId: v.taskId,
    seriesId: v.seriesId,
    occurrenceKey: v.occurrenceKey,
    originalLocalDate: local(v.originalLocalDate),
    scheduledStartAt: iso(v.scheduledStartAt),
    scheduledEndAt: iso(v.scheduledEndAt),
    status: v.status,
    completedAt: iso(v.completedAt),
    snapshot: v.snapshot as DTO["TaskDefinition"],
    canceled: v.canceledAt !== null,
  };
}
export function fixedDto(v: FixedSeries): DTO["FixedSeries"] {
  return {
    ...audit(v),
    rootSeriesId: v.rootSeriesId,
    kind: v.kind,
    title: v.title,
    notes: v.notes,
    location: v.location,
    weekdays: v.weekdays,
    timezone: "Asia/Tehran",
    effectiveFrom: dateString(v.effectiveFrom),
    effectiveUntil: local(v.effectiveUntil),
    localStartTime: v.localStartTime,
    localEndTime: v.localEndTime,
    endsNextDay: v.endsNextDay,
    everyWeeks: v.everyWeeks,
    anchorWeekStart: local(v.anchorWeekStart),
    parity: v.parity,
    terminatedAt: local(v.terminatedAt),
  };
}
export function seriesDto(v: TaskSeries): DTO["TaskSeries"] {
  return {
    ...audit(v),
    rootSeriesId: v.rootSeriesId,
    taskId: v.taskId,
    template: v.template as DTO["TaskDefinition"],
    weekdays: v.weekdays,
    timezone: "Asia/Tehran",
    effectiveFrom: dateString(v.effectiveFrom),
    effectiveUntil: local(v.effectiveUntil),
    localStartTime: v.localStartTime,
    durationMinutes: v.durationMinutes,
    terminatedAt: local(v.terminatedAt),
  };
}
export function exceptionDto(
  v: OccurrenceException,
): DTO["OccurrenceException"] {
  return {
    ...audit(v),
    rootSeriesId: v.rootSeriesId,
    originalOccurrenceKey: `${v.rootSeriesId}:${dateString(v.originalLocalDate)}`,
    originalLocalDate: dateString(v.originalLocalDate),
    action: v.kind,
    replacementTitle: v.title,
    replacementStartAt: iso(v.startAt),
    replacementEndAt: iso(v.endAt),
  };
}
export function bookDto(v: Book): DTO["Book"] {
  return {
    ...audit(v),
    title: v.title,
    author: v.author,
    totalPages: v.totalPages,
    currentPage: v.currentPage,
    status: v.status,
    deletedAt: iso(v.deletedAt),
  };
}
export function readingDto(v: ReadingSession): DTO["ReadingSession"] {
  return {
    ...audit(v),
    startedAt: v.startAt.toISOString(),
    endedAt: v.endAt.toISOString(),
    durationMinutes: (v.endAt.getTime() - v.startAt.getTime()) / 60000,
    pages: v.pages,
    bookId: v.bookId,
    occurrenceId: v.occurrenceId,
    topic: v.topic,
    note: v.note,
    bookTitleSnapshot: v.bookTitleSnapshot,
  };
}
export function goalDto(v: WeeklyGoal): DTO["WeeklyGoal"] {
  return {
    ...audit(v),
    weekStart: dateString(v.weekStart),
    unit: v.unit,
    target: v.target,
  };
}
