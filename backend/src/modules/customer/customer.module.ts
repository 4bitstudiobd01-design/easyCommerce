import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CustomerEntity } from './entities/customer.entity';
import { CustomerAddressEntity } from './entities/customer-address.entity';
import { CustomerNoteEntity } from './entities/customer-note.entity';
import { CustomerActivityEntity } from './entities/customer-activity.entity';
import { CustomerSegmentEntity } from './entities/customer-segment.entity';
import { LeadEntity } from './entities/lead.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { CustomerController } from './customer.controller';
import { TenantModule } from '../tenant/tenant.module';

import { CreateCustomerService } from './services/create-customer.service';
import { FindOrCreateCustomerService } from './services/find-or-create-customer.service';
import { ListCustomersService } from './services/list-customers.service';
import { GetCustomerKpiService } from './services/get-customer-kpi.service';
import { FindCustomerByIdService } from './services/find-customer-by-id.service';
import { UpdateCustomerService } from './services/update-customer.service';
import { UpdateCustomerStatusService } from './services/update-customer-status.service';
import { BulkCustomerStatusService } from './services/bulk-customer-status.service';

import { ListCustomerAddressesService } from './services/list-customer-addresses.service';
import { CreateCustomerAddressService } from './services/create-customer-address.service';
import { UpdateCustomerAddressService } from './services/update-customer-address.service';
import { SetDefaultCustomerAddressService } from './services/set-default-customer-address.service';
import { DeleteCustomerAddressService } from './services/delete-customer-address.service';
import { ListCustomerOrdersService } from './services/list-customer-orders.service';

import { ListCustomerNotesService } from './services/list-customer-notes.service';
import { CreateCustomerNoteService } from './services/create-customer-note.service';
import { DeleteCustomerNoteService } from './services/delete-customer-note.service';
import { RecordCustomerActivityService } from './services/record-customer-activity.service';
import { ListCustomerActivitiesService } from './services/list-customer-activities.service';
import { LogCustomerActivityService } from './services/log-customer-activity.service';

import { ExportCustomersService } from './services/export-customers.service';
import { ImportCustomersService } from './services/import-customers.service';

import { GetCustomerAnalyticsService } from './services/get-customer-analytics.service';
import { ManageCustomerSegmentService } from './services/manage-customer-segment.service';
import { FraudCheckService } from './services/fraud-check.service';

import { ListLeadsService } from './services/list-leads.service';
import { CreateLeadService } from './services/create-lead.service';
import { UpdateLeadStageService } from './services/update-lead-stage.service';
import { UpdateLeadDetailsService } from './services/update-lead-details.service';
import { ScheduleLeadFollowUpService } from './services/schedule-lead-follow-up.service';
import { ConvertLeadToCustomerService } from './services/convert-lead-to-customer.service';
import { SeedLeadsService } from './services/seed-leads.service';
import { SeedCustomersService } from './services/seed-customers.service';
import { ListStoreActivitiesService } from './services/list-store-activities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerEntity,
      CustomerAddressEntity,
      CustomerNoteEntity,
      CustomerActivityEntity,
      CustomerSegmentEntity,
      LeadEntity,
      OrderEntity,
    ]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CustomerController],
  providers: [
    CreateCustomerService,
    FindOrCreateCustomerService,
    ListCustomersService,
    GetCustomerKpiService,
    FindCustomerByIdService,
    UpdateCustomerService,
    UpdateCustomerStatusService,
    BulkCustomerStatusService,
    ListCustomerAddressesService,
    CreateCustomerAddressService,
    UpdateCustomerAddressService,
    SetDefaultCustomerAddressService,
    DeleteCustomerAddressService,
    ListCustomerOrdersService,
    ListCustomerNotesService,
    CreateCustomerNoteService,
    DeleteCustomerNoteService,
    RecordCustomerActivityService,
    ListCustomerActivitiesService,
    LogCustomerActivityService,
    ExportCustomersService,
    ImportCustomersService,
    GetCustomerAnalyticsService,
    ManageCustomerSegmentService,
    FraudCheckService,
    ListLeadsService,
    CreateLeadService,
    UpdateLeadStageService,
    UpdateLeadDetailsService,
    ScheduleLeadFollowUpService,
    ConvertLeadToCustomerService,
    SeedLeadsService,
    SeedCustomersService,
    ListStoreActivitiesService,
  ],
  exports: [
    CreateCustomerService,
    FindOrCreateCustomerService,
    ListCustomersService,
    GetCustomerKpiService,
    FindCustomerByIdService,
    UpdateCustomerService,
    UpdateCustomerStatusService,
    BulkCustomerStatusService,
    ListCustomerAddressesService,
    CreateCustomerAddressService,
    UpdateCustomerAddressService,
    SetDefaultCustomerAddressService,
    DeleteCustomerAddressService,
    ListCustomerOrdersService,
    ListCustomerNotesService,
    CreateCustomerNoteService,
    DeleteCustomerNoteService,
    RecordCustomerActivityService,
    ListCustomerActivitiesService,
    LogCustomerActivityService,
    ExportCustomersService,
    ImportCustomersService,
    GetCustomerAnalyticsService,
    ManageCustomerSegmentService,
    FraudCheckService,
    ListLeadsService,
    CreateLeadService,
    UpdateLeadStageService,
    UpdateLeadDetailsService,
    ScheduleLeadFollowUpService,
    ConvertLeadToCustomerService,
    SeedLeadsService,
    SeedCustomersService,
    TypeOrmModule,
    ListStoreActivitiesService,
  ],
})
export class CustomerModule {}
