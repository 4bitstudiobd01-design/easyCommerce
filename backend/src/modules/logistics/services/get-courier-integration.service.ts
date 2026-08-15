import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { CourierIntegrationDto } from '../dto/courier-integration-response.dto';
import { CourierIntegrationMapperService } from './courier-integration-mapper.service';

/**
 * One provider's integration for the details drawer.
 *
 * Returns a DTO even when the merchant has never connected the provider, so the
 * drawer can render the connect form from the adapter's declared credential
 * fields instead of special-casing "not found".
 */
@Injectable()
export class GetCourierIntegrationService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly registry: CourierProviderRegistry,
    private readonly mapper: CourierIntegrationMapperService,
  ) {}

  async execute(
    provider: CourierProviderEnum,
    tenantId: string,
  ): Promise<CourierIntegrationDto> {
    // Throws for an unsupported provider before any query runs.
    const adapter = this.registry.resolve(provider);

    const [integration, stats] = await Promise.all([
      this.integrationRepository.findOne({ where: { tenantId, provider } }),
      this.aggregateStats(tenantId, provider),
    ]);

    return this.mapper.toDto(adapter, integration ?? undefined, stats);
  }

  private async aggregateStats(tenantId: string, provider: CourierProviderEnum) {
    const concludedList = [
      ConsignmentStatusEnum.DELIVERED,
      ConsignmentStatusEnum.RETURNED,
      ConsignmentStatusEnum.DELIVERY_FAILED,
    ]
      .map((status) => `'${status}'`)
      .join(',');

    const row = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('COUNT(consignment.id)', 'shipments')
      .addSelect(
        `COUNT(CASE WHEN consignment.status = '${ConsignmentStatusEnum.DELIVERED}' THEN 1 END)`,
        'delivered',
      )
      .addSelect(
        `COUNT(CASE WHEN consignment.status IN (${concludedList}) THEN 1 END)`,
        'concluded',
      )
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .andWhere('consignment."courierProvider" = :provider', { provider })
      .getRawOne<{ shipments: string; delivered: string; concluded: string }>();

    return {
      shipments: Number(row?.shipments) || 0,
      delivered: Number(row?.delivered) || 0,
      concluded: Number(row?.concluded) || 0,
    };
  }
}
