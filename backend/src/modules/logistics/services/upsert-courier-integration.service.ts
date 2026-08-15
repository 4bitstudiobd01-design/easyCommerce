import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import {
  CourierCredentialBag,
  CourierIntegrationEntity,
} from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { CourierIntegrationDto } from '../dto/courier-integration-response.dto';
import { UpsertCourierIntegrationDto } from '../dto/upsert-courier-integration.dto';
import { CredentialsCryptoService } from './credentials-crypto.service';
import { GetCourierIntegrationService } from './get-courier-integration.service';

/**
 * Creates or updates a merchant's connection to one courier.
 *
 * Credentials are merged over what is stored (so a merchant can change one
 * field without re-typing the rest), validated against the provider's declared
 * required fields when enabling, then encrypted before they reach the database.
 * A raw secret never leaves this service — the response comes from the read
 * service, which masks.
 */
@Injectable()
export class UpsertCourierIntegrationService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    private readonly dataSource: DataSource,
    private readonly registry: CourierProviderRegistry,
    private readonly credentialsCrypto: CredentialsCryptoService,
    private readonly getCourierIntegrationService: GetCourierIntegrationService,
  ) {}

  async execute(
    provider: CourierProviderEnum,
    tenantId: string,
    dto: UpsertCourierIntegrationDto,
  ): Promise<CourierIntegrationDto> {
    const adapter = this.registry.resolve(provider);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CourierIntegrationEntity);

      const existing = await repository.findOne({ where: { tenantId, provider } });
      const stored = this.credentialsCrypto.decrypt(existing?.encryptedCredentials);

      const credentials: CourierCredentialBag = dto.credentials
        ? this.credentialsCrypto.merge(stored, dto.credentials)
        : stored;

      const isEnabled = dto.isEnabled ?? existing?.isEnabled ?? false;

      // Enabling a provider that cannot authenticate would leave a "Connected"
      // row that fails on the first booking, so the required fields are checked
      // here rather than at first use.
      if (isEnabled) {
        this.assertRequiredCredentials(adapter.profile.credentialFields, credentials);
      }

      const entity = repository.create({
        ...(existing ?? {}),
        tenantId,
        provider,
        isEnabled,
        sandbox: dto.sandbox ?? existing?.sandbox ?? false,
        autoCreateShipment: dto.autoCreateShipment ?? existing?.autoCreateShipment ?? false,
        autoUpdateTracking: dto.autoUpdateTracking ?? existing?.autoUpdateTracking ?? true,
        encryptedCredentials: this.credentialsCrypto.encrypt(credentials),
        // A credential change invalidates the previous test result — leaving the
        // old "passed" badge on new keys would be a false assurance.
        ...(dto.credentials
          ? { lastTestedAt: null, lastTestSucceeded: null, lastTestMessage: null }
          : {}),
      });

      // A disabled provider can never remain the default one.
      if (!isEnabled) {
        entity.isDefault = false;
      }

      const saved = await repository.save(entity);

      if (dto.isDefault === true) {
        if (!isEnabled) {
          throw new BadRequestException(
            'Connect this courier before making it the default provider.',
          );
        }
        // Exactly one default per tenant, cleared in the same transaction so a
        // failure here cannot leave the merchant with two or none.
        await repository.update(
          { tenantId, isDefault: true },
          { isDefault: false },
        );
        await repository.update({ id: saved.id }, { isDefault: true });
      } else if (dto.isDefault === false) {
        await repository.update({ id: saved.id }, { isDefault: false });
      }
    });

    return this.getCourierIntegrationService.execute(provider, tenantId);
  }

  private assertRequiredCredentials(
    fields: Array<{ key: string; label: string; required: boolean }>,
    credentials: CourierCredentialBag,
  ): void {
    const missing = fields
      .filter((field) => field.required)
      .filter((field) => {
        const value = credentials[field.key as keyof CourierCredentialBag];
        return typeof value !== 'string' || value.trim().length === 0;
      })
      .map((field) => field.label);

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required credentials for this courier: ${missing.join(', ')}.`,
      );
    }
  }
}
