import { Injectable } from '@nestjs/common';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { ICourierAdapter } from '../adapters/courier.adapter';
import {
  CourierApiHealth,
  CourierConnectionStatus,
  CourierIntegrationDto,
} from '../dto/courier-integration-response.dto';
import { CredentialsCryptoService } from './credentials-crypto.service';

/** Shipment counts aggregated per provider for one tenant. */
export interface CourierShipmentStats {
  shipments: number;
  delivered: number;
  /** Delivered + returned + failed — the ones whose outcome is already known. */
  concluded: number;
}

/**
 * Turns an adapter (the provider) plus an optional integration row (the
 * merchant's connection) plus shipment counts into the single shape the
 * Couriers tab renders.
 *
 * It exists as its own service because five endpoints return this DTO, and
 * duplicating the masking and health-band rules across them is exactly how a
 * secret eventually leaks out of one of them.
 */
@Injectable()
export class CourierIntegrationMapperService {
  constructor(private readonly credentialsCrypto: CredentialsCryptoService) {}

  toDto(
    adapter: ICourierAdapter,
    integration: CourierIntegrationEntity | undefined,
    stats: CourierShipmentStats = { shipments: 0, delivered: 0, concluded: 0 },
  ): CourierIntegrationDto {
    const credentials = this.credentialsCrypto.decrypt(integration?.encryptedCredentials);
    const hasCredentials = Object.keys(credentials).length > 0;
    const apiSuccessRate = this.apiSuccessRate(integration);

    return {
      // Providers the merchant has never touched have no row, so the provider
      // code stands in as a stable key for the table.
      id: integration?.id ?? adapter.provider,
      code: adapter.provider,
      name: adapter.displayName,
      type: adapter.profile.serviceType,
      status: this.connectionStatus(integration, hasCredentials),
      apiHealth: this.healthBand(integration, apiSuccessRate),
      apiSuccessRate,
      shipments: stats.shipments,
      delivered: stats.delivered,
      // Measured against concluded shipments only — parcels still in transit
      // have not failed, and counting them as failures understates every
      // provider a merchant is actively using.
      successRate:
        stats.concluded > 0 ? this.round((stats.delivered / stats.concluded) * 100) : 0,
      codSupport: adapter.profile.codSupport,
      coverage: adapter.profile.coverage,
      website: adapter.profile.website,
      isEnabled: integration?.isEnabled ?? false,
      isDefault: integration?.isDefault ?? false,
      sandbox: integration?.sandbox ?? false,
      autoCreateShipment: integration?.autoCreateShipment ?? false,
      autoUpdateTracking: integration?.autoUpdateTracking ?? true,
      supportsCancellation: adapter.profile.supportsCancellation,
      supportsTracking: adapter.profile.supportsTracking,
      lastApiSync: integration?.lastApiSyncAt ?? null,
      lastWebhook: integration?.lastWebhookAt ?? null,
      lastTestedAt: integration?.lastTestedAt ?? null,
      lastTestSucceeded: integration?.lastTestSucceeded ?? null,
      lastTestMessage: integration?.lastTestMessage ?? null,
      hasCredentials,
      credentialFields: adapter.profile.credentialFields,
      maskedCredentials: this.credentialsCrypto.mask(credentials),
    };
  }

  /**
   * A provider is only "Connected" when it is both enabled and holds
   * credentials — an enabled row with nothing to authenticate with cannot book
   * a parcel, and showing it as connected would mislead the merchant.
   */
  private connectionStatus(
    integration: CourierIntegrationEntity | undefined,
    hasCredentials: boolean,
  ): CourierConnectionStatus {
    if (!integration || !integration.isEnabled) return CourierConnectionStatus.DISCONNECTED;
    if (!hasCredentials) return CourierConnectionStatus.ERROR;
    if (integration.lastTestSucceeded === false) return CourierConnectionStatus.ERROR;
    return CourierConnectionStatus.CONNECTED;
  }

  private apiSuccessRate(integration: CourierIntegrationEntity | undefined): number {
    if (!integration || integration.apiCallsTotal <= 0) return 0;
    const succeeded = integration.apiCallsTotal - integration.apiCallsFailed;
    return this.round((succeeded / integration.apiCallsTotal) * 100);
  }

  private healthBand(
    integration: CourierIntegrationEntity | undefined,
    apiSuccessRate: number,
  ): CourierApiHealth {
    // Never called: there is no rate to band, and inventing one would be worse
    // than saying so.
    if (!integration || integration.apiCallsTotal <= 0) return CourierApiHealth.NOT_AVAILABLE;
    if (apiSuccessRate >= 95) return CourierApiHealth.HEALTHY;
    if (apiSuccessRate >= 80) return CourierApiHealth.FAIR;
    return CourierApiHealth.POOR;
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }

  /** Indexes integration rows by provider for O(1) pairing with adapters. */
  indexByProvider(
    integrations: CourierIntegrationEntity[],
  ): Map<CourierProviderEnum, CourierIntegrationEntity> {
    return new Map(integrations.map((integration) => [integration.provider, integration]));
  }
}
