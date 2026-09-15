import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CourierCredentials } from '../adapters/courier.adapter';
import { CredentialsCryptoService } from './credentials-crypto.service';

/**
 * The single place shipment services get courier credentials from.
 *
 * Resolution order:
 *  1. the tenant's `courier_integrations` row — where every new save lands;
 *  2. the legacy `stores.steadfastApiKey` / `pathaoClientId` columns, so
 *     merchants who configured a courier before this table existed keep booking
 *     without re-entering anything;
 *  3. nothing, which the adapters treat as sandbox mode.
 *
 * Centralising this means booking, cancelling and syncing can never disagree
 * about which credentials are in force.
 */
@Injectable()
export class ResolveCourierCredentialsService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    private readonly credentialsCrypto: CredentialsCryptoService,
  ) {}

  async execute(
    tenantId: string,
    provider: CourierProviderEnum,
    store?: StoreEntity | null,
  ): Promise<CourierCredentials> {
    const integration = await this.integrationRepository.findOne({
      where: { tenantId, provider },
    });

    // A disconnected provider's stored keys are deliberately ignored: the
    // merchant switched it off, so bookings must not keep using it.
    if (integration?.isEnabled) {
      const credentials = this.credentialsCrypto.decrypt(integration.encryptedCredentials);
      if (Object.keys(credentials).length > 0) return credentials;
    }

    return this.legacyStoreCredentials(provider, store);
  }

  /** Pre-`courier_integrations` credentials that still live on the store row. */
  private legacyStoreCredentials(
    provider: CourierProviderEnum,
    store?: StoreEntity | null,
  ): CourierCredentials {
    if (!store) return {};

    switch (provider) {
      case CourierProviderEnum.STEADFAST:
        return {
          apiKey: store.steadfastApiKey,
          secretKey: store.steadfastSecretKey,
        };
      case CourierProviderEnum.PATHAO:
        return {
          clientId: store.pathaoClientId,
          clientSecret: store.pathaoClientSecret,
        };
      default:
        // RedX and Paperfly never had store columns — nothing to fall back to.
        return {};
    }
  }
}
