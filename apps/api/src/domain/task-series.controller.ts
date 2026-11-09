import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { OwnerRequest } from "../auth/session";
import { TaskSeriesService } from "./task-series.service";
@Controller("task-series")
export class TaskSeriesController {
  constructor(private readonly series: TaskSeriesService) {}
  @Get() list(@Req() req: OwnerRequest, @Query() query: unknown) {
    return this.series.list(req, query);
  }
  @Post() create(@Req() req: OwnerRequest, @Body() body: unknown) {
    return this.series.create(req, body);
  }
  @Patch(":id") update(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.series.update(req, id, body);
  }
  @Delete(":id") delete(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.series.delete(req, id, body);
  }
}
