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
import { FixedService } from "./fixed.service";
@Controller("fixed-schedules")
export class FixedController {
  constructor(private readonly fixed: FixedService) {}
  @Get() list(@Req() req: OwnerRequest, @Query() query: unknown) {
    return this.fixed.list(req, query);
  }
  @Post() create(@Req() req: OwnerRequest, @Body() body: unknown) {
    return this.fixed.create(req, body);
  }
  @Patch(":id") update(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.fixed.update(req, id, body);
  }
  @Delete(":id") delete(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.fixed.delete(req, id, body);
  }
  @Get(":id/exceptions") exceptions(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Query() query: unknown,
  ) {
    return this.fixed.exceptions(req, id, query);
  }
  @Post(":id/exceptions") createException(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.fixed.exceptionWrite(req, id, body);
  }
  @Patch(":id/exceptions/:exceptionId") updateException(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Param("exceptionId") exceptionId: string,
    @Body() body: unknown,
  ) {
    return this.fixed.exceptionWrite(req, id, body, exceptionId);
  }
  @Delete(":id/exceptions/:exceptionId") deleteException(
    @Req() req: OwnerRequest,
    @Param("id") id: string,
    @Param("exceptionId") exceptionId: string,
    @Body() body: unknown,
  ) {
    return this.fixed.exceptionWrite(req, id, body, exceptionId, true);
  }
}
