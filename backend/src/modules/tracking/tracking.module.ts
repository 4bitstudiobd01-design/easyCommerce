import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorefrontSessionEntity } from './entities/storefront-session.entity';
import { TenantModule } from '../tenant/tenant.module';
import { RecordVisitService } from './services/record-visit.service';
import { GetTrafficSourcesService } from './services/get-traffic-sources.service';
import { TrackingController } from './tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StorefrontSessionEntity]), TenantModule],
  controllers: [TrackingController],
  providers: [RecordVisitService, GetTrafficSourcesService],
  exports: [GetTrafficSourcesService, TypeOrmModule],
})
export class TrackingModule {}
