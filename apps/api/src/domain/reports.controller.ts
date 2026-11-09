import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { parse } from "../http/errors";
import { ReportsService } from "./reports.service";
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get("reports/weekly") weekly(
    @Req() req: OwnerRequest,
    @Query() raw: unknown,
  ) {
    const q = parse(z.object({ weekStart: z.string() }).strict(), raw);
    return this.reports.weekly(req, q.weekStart);
  }
  @Get("export") export(
    @Req() req: OwnerRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="sarvin-planner-export.json"',
    );
    return this.reports.export(req);
  }
}
