import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MarketingController } from './marketing.controller';
import { StorefrontPixelsController } from './storefront-pixels.controller';
import { GetMarketingDashboardService } from './services/get-marketing-dashboard.service';
import { ListAdSpendService } from './services/list-ad-spend.service';
import { UpsertAdSpendService } from './services/upsert-ad-spend.service';
import { DeleteAdSpendService } from './services/delete-ad-spend.service';
import { GetSourceSalesReportService } from './services/get-source-sales-report.service';
import { MarketingPixelCryptoService } from './services/marketing-pixel-crypto.service';
import { ListPixelsService } from './services/list-pixels.service';
import { GetPixelService } from './services/get-pixel.service';
import { CreatePixelService } from './services/create-pixel.service';
import { UpdatePixelService } from './services/update-pixel.service';
import { DeletePixelService } from './services/delete-pixel.service';
import { TestPixelEventService } from './services/test-pixel-event.service';
import { GetPageRulesService } from './services/get-page-rules.service';
import { ReplacePageRulesService } from './services/replace-page-rules.service';
import { ListMarketingLogsService } from './services/list-marketing-logs.service';
import { GetStorefrontPixelsService } from './services/get-storefront-pixels.service';
import { IngestBrowserEventService } from './services/ingest-browser-event.service';
import { DispatchServerEventService } from './services/dispatch-server-event.service';
import { MarketingCapiProducer, MARKETING_CAPI_QUEUE } from '../../common/marketing/marketing-capi.producer';
import { MarketingCapiProcessor } from './marketing-capi.processor';
import { MetaCapiAdapter } from './capi/meta-capi.adapter';
import { TiktokEventsAdapter } from './capi/tiktok-events.adapter';
import { Ga4MeasurementAdapter } from './capi/ga4-measurement.adapter';
import { GoogleAdsCapiAdapter } from './capi/google-ads-capi.adapter';
import { MarketingPixel } from './entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from './entities/marketing-pixel-page-rule.entity';
import { MarketingEventConfig } from './entities/marketing-event-config.entity';
import { MarketingEventLog } from './entities/marketing-event-log.entity';
import { MarketingAdSpend } from './entities/marketing-ad-spend.entity';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { TrackingModule } from '../tracking/tracking.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingPixel,
      MarketingPixelPageRule,
      MarketingEventConfig,
      MarketingEventLog,
      MarketingAdSpend,
    ]),
    BullModule.registerQueue({ name: MARKETING_CAPI_QUEUE }),
    AuthModule,
    TenantModule,
    // Supplies GetMyPermissionsService, which PermissionsGuard resolves per request.
    StaffModule,
    // Supplies GetTrafficSourcesService for the Sales-by-Source report.
    TrackingModule,
  ],
  controllers: [MarketingController, StorefrontPixelsController],
  providers: [
    GetMarketingDashboardService,
    ListAdSpendService,
    UpsertAdSpendService,
    DeleteAdSpendService,
    GetSourceSalesReportService,
    MarketingPixelCryptoService,
    ListPixelsService,
    GetPixelService,
    CreatePixelService,
    UpdatePixelService,
    DeletePixelService,
    TestPixelEventService,
    GetPageRulesService,
    ReplacePageRulesService,
    ListMarketingLogsService,
    GetStorefrontPixelsService,
    IngestBrowserEventService,
    DispatchServerEventService,
    MarketingCapiProducer,
    MarketingCapiProcessor,
    MetaCapiAdapter,
    TiktokEventsAdapter,
    Ga4MeasurementAdapter,
    GoogleAdsCapiAdapter,
    PermissionsGuard,
  ],
  exports: [
    GetMarketingDashboardService,
    MarketingPixelCryptoService,
    MarketingCapiProducer,
  ],
})
export class MarketingModule {}
