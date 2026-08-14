import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { GetMarketingLogsService } from './services/get-marketing-logs.service';
import { MarketingPixel } from './entities/marketing-pixel.entity';
import { MarketingEventConfig } from './entities/marketing-event-config.entity';
import { MarketingEventLog } from './entities/marketing-event-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingPixel,
      MarketingEventConfig,
      MarketingEventLog,
    ]),
    AuthModule,
  ],
  controllers: [MarketingController],
  providers: [
    GetMarketingDashboardService,
    GetMarketingLogsService,
  ],
  exports: [],
})
export class MarketingModule {}
