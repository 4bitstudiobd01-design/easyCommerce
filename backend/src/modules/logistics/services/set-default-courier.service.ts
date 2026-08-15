import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { CourierIntegrationDto } from '../dto/courier-integration-response.dto';
import { GetCourierIntegrationService } from './get-courier-integration.service';

/**
 * Marks one provider as the merchant's default for booking.
 *
 * The clear-then-set runs in a single transaction because the invariant is
 * "exactly one default per tenant" — a partial failure that clears the old
 * default without setting the new one would leave the booking form with no
 * pre-selection.
 */
@Injectable()
export class SetDefaultCourierService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly registry: CourierProviderRegistry,
    private readonly getCourierIntegrationService: GetCourierIntegrationService,
  ) {}

  async execute(
    provider: CourierProviderEnum,
    tenantId: string,
  ): Promise<CourierIntegrationDto> {
    const adapter = this.registry.resolve(provider);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CourierIntegrationEntity);

      const integration = await repository.findOne({ where: { tenantId, provider } });

      if (!integration) {
        throw new NotFoundException(
          `${adapter.displayName} has not been connected yet. Add its credentials first.`,
        );
      }
      if (!integration.isEnabled) {
        throw new BadRequestException(
          `Connect ${adapter.displayName} before making it the default courier.`,
        );
      }

      await repository.update({ tenantId, isDefault: true }, { isDefault: false });
      await repository.update({ id: integration.id }, { isDefault: true });
    });

    return this.getCourierIntegrationService.execute(provider, tenantId);
  }
}
