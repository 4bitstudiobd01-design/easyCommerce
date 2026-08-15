import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';

/**
 * Records the outcome of one courier API call so the Couriers tab's health
 * column reflects reality instead of a hardcoded number.
 *
 * Counters are incremented with a single SQL UPDATE rather than read-modify-
 * write, so concurrent bookings cannot lose an increment. Failures here are
 * swallowed and logged: health telemetry must never be the reason a merchant's
 * parcel fails to book.
 */
@Injectable()
export class RecordCourierApiCallService {
  private readonly logger = new Logger(RecordCourierApiCallService.name);

  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
  ) {}

  async execute(
    tenantId: string,
    provider: CourierProviderEnum,
    succeeded: boolean,
  ): Promise<void> {
    try {
      await this.integrationRepository
        .createQueryBuilder()
        .update(CourierIntegrationEntity)
        .set({
          apiCallsTotal: () => '"apiCallsTotal" + 1',
          apiCallsFailed: () => (succeeded ? '"apiCallsFailed"' : '"apiCallsFailed" + 1'),
          lastApiSyncAt: new Date(),
        })
        .where('"tenantId" = :tenantId AND provider = :provider', { tenantId, provider })
        .execute();
    } catch (err) {
      this.logger.warn(
        `Could not record ${provider} API health for tenant ${tenantId}: ${err?.message}`,
      );
    }
  }
}
