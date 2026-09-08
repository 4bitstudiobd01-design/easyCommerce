import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ConnectPixelService } from './services/connect-pixel.service';
import { DisconnectPixelService } from './services/disconnect-pixel.service';
import { ListAdSpendService } from './services/list-ad-spend.service';
import { UpsertAdSpendService } from './services/upsert-ad-spend.service';
import { DeleteAdSpendService } from './services/delete-ad-spend.service';
import { GetSourceSalesReportService } from './services/get-source-sales-report.service';
import { MarketingPixel } from './entities/marketing-pixel.entity';
import { MarketingEventConfig } from './entities/marketing-event-config.entity';
import { MarketingEventLog } from './entities/marketing-event-log.entity';
import { MarketingAdSpend } from './entities/marketing-ad-spend.entity';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { TrackingModule } from '../tracking/tracking.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingPixel,
      MarketingEventConfig,
      MarketingEventLog,
      MarketingAdSpend,
    ]),
    AuthModule,
    TenantModule,
    // Supplies GetMyPermissionsService, which PermissionsGuard resolves per request.
    StaffModule,
    // Supplies GetTrafficSourcesService for the Sales-by-Source report.
    TrackingModule,
  ],
  controllers: [MarketingController],
  providers: [
    GetMarketingDashboardService,
    ConnectPixelService,
    DisconnectPixelService,
    ListAdSpendService,
    UpsertAdSpendService,
    DeleteAdSpendService,
    GetSourceSalesReportService,
    PermissionsGuard,
  ],
  exports: [
    GetMarketingDashboardService,
    ConnectPixelService,
  ],
})
export class MarketingModule {}
