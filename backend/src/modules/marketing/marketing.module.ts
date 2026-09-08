import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
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
    ConnectPixelService,
    DisconnectPixelService,
  ],
  exports: [
    GetMarketingDashboardService,
    ConnectPixelService,
  ],
})
export class MarketingModule {}
