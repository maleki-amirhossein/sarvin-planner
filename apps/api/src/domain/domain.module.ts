import { PrismaModule } from "../prisma/prisma.module";
import { FixedService } from "./fixed.service";
import { FixedController } from "./fixed.controller";
import { SeriesConflicts } from "./series-conflicts";
import { TaskSeriesService } from "./task-series.service";
import { TaskSeriesController } from "./task-series.controller";
import { ReadingService } from "./reading.service";
import { ReadingController } from "./reading.controller";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { Module } from "@nestjs/common";
import { Mutations } from "./mutations";
import { ScheduleService } from "./schedule.service";
import { TasksService } from "./tasks.service";
import { SettingsService } from "./settings.service";
import { TasksController } from "./tasks.controller";
import { SettingsController } from "./settings.controller";
import { ScheduleController } from "./schedule.controller";
@Module({
  imports: [PrismaModule],
  providers: [
    ReportsService,
    ReadingService,
    TaskSeriesService,
    FixedService,
    SeriesConflicts,
    Mutations,
    ScheduleService,
    TasksService,
    SettingsService,
  ],
  controllers: [
    ReportsController,
    ReadingController,
    TaskSeriesController,
    FixedController,
    TasksController,
    SettingsController,
    ScheduleController,
  ],
})
export class DomainModule {}
