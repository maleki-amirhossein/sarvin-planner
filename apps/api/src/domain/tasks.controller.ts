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
import { TasksService } from "./tasks.service";
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}
  @Get("tasks") list(@Req() req: OwnerRequest, @Query() query: unknown) {
    return this.tasks.list(req, query);
  }
  @Post("tasks") create(@Req() req: OwnerRequest, @Body() body: unknown) {
    return this.tasks.create(req, body);
  }
  @Get("tasks/:id") get(@Req() req: OwnerRequest, @Param("id") id: string) {
    return this.tasks.get(req, id);
  }
  @Patch("tasks/:id") update(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.tasks.update(req, id, body);
  }
  @Delete("tasks/:id") delete(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
  ) {
    return this.tasks.delete(req, id);
  }
  @Get("task-occurrences") occurrences(
    @Req() req: OwnerRequest,
    @Query() query: unknown,
  ) {
    return this.tasks.occurrences(req, query);
  }
  @Get("task-occurrences/:id") occurrence(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
  ) {
    return this.tasks.occurrence(req, id);
  }
  @Patch("task-occurrences/:id") updateOccurrence(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.tasks.mutateOccurrence(req, id, body);
  }
  @Delete("task-occurrences/:id") deleteOccurrence(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
  ) {
    return this.tasks.mutateOccurrence(req, id, {}, true);
  }
}
