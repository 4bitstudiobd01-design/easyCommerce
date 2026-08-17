import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsignmentEntity } from './entities/consignment.entity';
import { ConsignmentEventEntity } from './entities/consignment-event.entity';
import { CourierIntegrationEntity } from './entities/courier-integration.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../order/entities/order-status-history.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { TenantModule } from '../tenant/tenant.module';
import { OrderModule } from '../order/order.module';
import { StaffModule } from '../staff/staff.module';

import { ShipmentDomainService } from './services/shipment-domain.service';
import { ListShipmentsService } from './services/list-shipments.service';
import { GetShipmentSummaryService } from './services/get-shipment-summary.service';
import { GetShipmentDetailsService } from './services/get-shipment-details.service';
import { CreateShipmentService } from './services/create-shipment.service';
import { CancelShipmentService } from './services/cancel-shipment.service';
import { ExportShipmentsService } from './services/export-shipments.service';
import { SyncConsignmentService } from './services/sync-consignment.service';
import { SeedShipmentDemoDataService } from './services/seed-shipment-demo-data.service';
import { CredentialsCryptoService } from './services/credentials-crypto.service';
import { CourierIntegrationMapperService } from './services/courier-integration-mapper.service';
import { ListCourierIntegrationsService } from './services/list-courier-integrations.service';
import { GetCourierIntegrationService } from './services/get-courier-integration.service';
import { UpsertCourierIntegrationService } from './services/upsert-courier-integration.service';
import { ToggleCourierIntegrationService } from './services/toggle-courier-integration.service';
import { SetDefaultCourierService } from './services/set-default-courier.service';
import { TestCourierConnectionService } from './services/test-courier-connection.service';
import { RecordCourierApiCallService } from './services/record-courier-api-call.service';
import { ResolveCourierCredentialsService } from './services/resolve-courier-credentials.service';
import { SeedCourierDemoDataService } from './services/seed-courier-demo-data.service';

import { CourierProviderRegistry } from './adapters/courier-provider.registry';
import { SteadfastCourierAdapter } from './adapters/steadfast.adapter';
import { PathaoCourierAdapter } from './adapters/pathao.adapter';
import { PaperflyCourierAdapter } from './adapters/paperfly.adapter';
import { RedxCourierAdapter } from './adapters/redx.adapter';

import { LogisticsController } from './logistics.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsignmentEntity,
      ConsignmentEventEntity,
      CourierIntegrationEntity,
      OrderEntity,
      StoreEntity,
      OrderStatusHistoryEntity,
    ]),
    TenantModule,
    OrderModule,
    // Supplies GetMyPermissionsService, which PermissionsGuard resolves per request.
    StaffModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [LogisticsController],
  providers: [
    ShipmentDomainService,
    ListShipmentsService,
    GetShipmentSummaryService,
    GetShipmentDetailsService,
    CreateShipmentService,
    CancelShipmentService,
    ExportShipmentsService,
    SyncConsignmentService,
    SeedShipmentDemoDataService,
    CredentialsCryptoService,
    CourierIntegrationMapperService,
    ListCourierIntegrationsService,
    GetCourierIntegrationService,
    UpsertCourierIntegrationService,
    ToggleCourierIntegrationService,
    SetDefaultCourierService,
    TestCourierConnectionService,
    RecordCourierApiCallService,
    ResolveCourierCredentialsService,
    SeedCourierDemoDataService,
    CourierProviderRegistry,
    SteadfastCourierAdapter,
    PathaoCourierAdapter,
    PaperflyCourierAdapter,
    RedxCourierAdapter,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    ShipmentDomainService,
    ListShipmentsService,
    GetShipmentSummaryService,
    GetShipmentDetailsService,
    CreateShipmentService,
    CancelShipmentService,
    SyncConsignmentService,
    ResolveCourierCredentialsService,
    CourierProviderRegistry,
    TypeOrmModule,
  ],
})
export class LogisticsModule {}
