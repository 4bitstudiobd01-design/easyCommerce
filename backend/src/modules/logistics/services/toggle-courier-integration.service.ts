import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { CourierIntegrationDto } from '../dto/courier-integration-response.dto';
import { CredentialsCryptoService } from './credentials-crypto.service';
import { GetCourierIntegrationService } from './get-courier-integration.service';

/**
 * Enables or disables an existing connection.
 *
 * Distinct from upsert on purpose: this is the row-level on/off switch in the
 * table, and it must never be a path through which credentials can be written.
 * Disconnecting keeps the stored credentials so reconnecting is one click.
 */
@Injectable()
export class ToggleCourierIntegrationService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    private readonly registry: CourierProviderRegistry,
    private readonly credentialsCrypto: CredentialsCryptoService,
    private readonly getCourierIntegrationService: GetCourierIntegrationService,
  ) {}

  async execute(
    provider: CourierProviderEnum,
    tenantId: string,
    isEnabled?: boolean,
  ): Promise<CourierIntegrationDto> {
    const adapter = this.registry.resolve(provider);

    const integration = await this.integrationRepository.findOne({
      where: { tenantId, provider },
    });

    if (!integration) {
      throw new NotFoundException(
        `${adapter.displayName} has not been connected yet. Add its credentials first.`,
      );
    }

    const nextState = isEnabled ?? !integration.isEnabled;

    if (nextState) {
      const credentials = this.credentialsCrypto.decrypt(integration.encryptedCredentials);
      const missing = adapter.profile.credentialFields
        .filter((field) => field.required)
        .filter((field) => {
          const value = credentials[field.key as keyof typeof credentials];
          return typeof value !== 'string' || value.trim().length === 0;
        })
        .map((field) => field.label);

      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot enable ${adapter.displayName} — missing: ${missing.join(', ')}.`,
        );
      }
    }

    integration.isEnabled = nextState;
    // A provider that is switched off cannot stay the booking default.
    if (!nextState) integration.isDefault = false;

    await this.integrationRepository.save(integration);

    return this.getCourierIntegrationService.execute(provider, tenantId);
  }
}
