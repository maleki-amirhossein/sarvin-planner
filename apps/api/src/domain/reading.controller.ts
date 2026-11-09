import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import type { OwnerRequest } from "../auth/session";
import { ReadingService } from "./reading.service";
@Controller()
export class ReadingController {
  constructor(private readonly reading: ReadingService) {}
  @Get("books") books(@Req() req: OwnerRequest, @Query() query: unknown) {
    return this.reading.books(req, query);
  }
  @Post("books") createBook(@Req() req: OwnerRequest, @Body() body: unknown) {
    return this.reading.bookCreate(req, body);
  }
  @Patch("books/:id") updateBook(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.reading.bookUpdate(req, id, body);
  }
  @Delete("books/:id") deleteBook(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
  ) {
    return this.reading.bookUpdate(req, id, {}, true);
  }
  @Get("reading-sessions") sessions(
    @Req() req: OwnerRequest,
    @Query() query: unknown,
  ) {
    return this.reading.sessions(req, query);
  }
  @Post("reading-sessions") create(
    @Req() req: OwnerRequest,
    @Body() body: unknown,
  ) {
    return this.reading.create(req, body);
  }
  @Post("reading-sessions/quick") quick(
    @Req() req: OwnerRequest,
    @Body() body: unknown,
  ) {
    return this.reading.create(req, body, true);
  }
  @Patch("reading-sessions/:id") update(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.reading.update(req, id, body);
  }
  @Delete("reading-sessions/:id") delete(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
  ) {
    return this.reading.update(req, id, {}, true);
  }
  @Get("weekly-goals/:week") goal(
    @Req() req: OwnerRequest,
    @Param("week") week: string,
  ) {
    return this.reading.getGoal(req, week);
  }
  @Put("weekly-goals/:week") setGoal(
    @Req() req: OwnerRequest,
    @Param("week") week: string,
    @Body() body: unknown,
  ) {
    return this.reading.goalWrite(req, week, body);
  }
  @Delete("weekly-goals/:week") deleteGoal(
    @Req() req: OwnerRequest,
    @Param("week") week: string,
  ) {
    return this.reading.goalWrite(req, week, {}, true);
  }
}
