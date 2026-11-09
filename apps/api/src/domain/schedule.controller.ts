import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { input, type DTO } from "../http/contracts";
import { expand } from "../time/recurrence";
import { dbDate, overlap } from "../time/calendar";
import { safeRange } from "./schedule.service";
import { parse } from "../http/errors";
import { Mutations } from "./mutations";
import { ScheduleService } from "./schedule.service";
@Controller("schedule")
export class ScheduleController {
  constructor(
    private readonly mutations: Mutations,
    private readonly schedule: ScheduleService,
  ) {}
  @Get() read(@Req() req: OwnerRequest, @Query() raw: unknown) {
    const query = parse(
      z.object({ from: z.string(), to: z.string() }).strict(),
      raw,
    );
    return this.mutations.run(req, "schedule.read", query, (tx, revision) =>
      this.schedule.read(tx, req.owner.id, query.from, query.to, revision),
    );
  }
  @Post("preview")
  @HttpCode(200)
  preview(@Req() req: OwnerRequest, @Body() raw: unknown) {
    const body = input("RecurrencePreviewRequest", raw),
      requested = safeRange(body.from, body.to);
    const source = body.rule;
    const fixed = "kind" in source;
    const rule = {
      ...source,
      id: "preview",
      rootSeriesId: "preview",
      title: fixed ? source.title : source.template.title,
      version: 1,
      effectiveFrom: dbDate(source.effectiveFrom),
      effectiveUntil: source.effectiveUntil
        ? dbDate(source.effectiveUntil)
        : null,
      anchorWeekStart:
        fixed && source.anchorWeekStart ? dbDate(source.anchorWeekStart) : null,
      parity: fixed ? source.parity : null,
    };
    return this.mutations.run(req, "schedule.preview", body, async (tx) => {
      const candidates = expand(rule, requested.from, requested.to).filter(
        (event) => overlap(event, requested.bounds),
      );
      const existing = await this.schedule.events(
        tx,
        req.owner.id,
        body.from,
        body.to,
      );
      const conflicts = existing
        .filter((event) =>
          candidates.some((candidate) =>
            overlap(candidate, {
              startAt: new Date(event.startAt),
              endAt: new Date(event.endAt),
            }),
          ),
        )
        .map((event) => ({
          id: event.id,
          occurrenceKey: event.occurrenceKey,
          title: event.title,
          kind: event.kind,
          startAt: event.startAt,
          endAt: event.endAt,
          version: event.version,
        }));
      const events: DTO["ScheduleEvent"][] = candidates.map((event) => ({
        id: event.occurrenceKey,
        occurrenceKey: event.occurrenceKey,
        kind: fixed ? source.kind : "task",
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        category: fixed
          ? source.kind === "work"
            ? "work"
            : "university"
          : (source.template.category ?? "personal"),
        priority: fixed ? null : (source.template.priority ?? "normal"),
        status: fixed ? null : "incomplete",
        version: 1,
        taskId: null,
        seriesId: null,
        originalLocalDate: event.originalLocalDate,
        editable: false,
        resizable: false,
        completionAllowed: false,
        continuesBefore: event.startAt < requested.bounds.startAt,
        continuesAfter: event.endAt > requested.bounds.endAt,
      }));
      return { events, conflicts };
    });
  }
}
