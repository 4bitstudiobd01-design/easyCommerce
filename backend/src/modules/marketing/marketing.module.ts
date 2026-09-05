import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { GetMarketingLogsService } from './services/get-marketing-logs.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
import { ToggleTrackingEventService } from './services/toggle-tracking-event.service';
import { DispatchTestEventService } from './services/dispatch-test-event.service';
import { SeedMarketingDemoDataService } from './services/seed-marketing-demo-data.service';
import { MarketingPixel } from './entities/marketing-pixel.entity';
import { MarketingEventConfig } from './entities/marketing-event-config.entity';
import { MarketingEventLog } from './entities/marketing-event-log.entity';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingPixel,
      MarketingEventConfig,
      MarketingEventLog,
    ]),
    AuthModule,
    TenantModule,
  ],
  controllers: [MarketingController],
  providers: [
    GetMarketingDashboardService,
    GetMarketingLogsService,
    ConnectPixelService,
    DisconnectPixelService,
    ToggleTrackingEventService,
    DispatchTestEventService,
    SeedMarketingDemoDataService,
  ],
  exports: [
    GetMarketingDashboardService,
    GetMarketingLogsService,
    ConnectPixelService,
    DispatchTestEventService,
  ],
})
export class MarketingModule {}
