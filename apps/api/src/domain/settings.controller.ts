import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import type { OwnerRequest } from "../auth/session";
import { SettingsService } from "./settings.service";
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get("settings") read(@Req() req: OwnerRequest) {
    return this.settings.read(req.owner.id);
  }
  @Patch("settings") update(@Req() req: OwnerRequest, @Body() body: unknown) {
    return this.settings.update(req, body);
  }
  @Post("settings/onboarding") @HttpCode(200) onboard(
    @Req() req: OwnerRequest,
    @Body() body: unknown,
  ) {
    return this.settings.onboard(req, body);
  }
  @Get("daily-priorities/:date") priorities(
    @Req() req: OwnerRequest,
    @Param("date") day: string,
  ) {
    return this.settings.priorities(req.owner.id, day);
  }
  @Put("daily-priorities/:date") setPriorities(
    @Req() req: OwnerRequest,
    @Param("date") day: string,
    @Body() body: unknown,
  ) {
    return this.settings.setPriorities(req, day, body);
  }
}
