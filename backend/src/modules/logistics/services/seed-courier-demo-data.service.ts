import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { SeedCourierDemoDataResponseDto } from '../dto/courier-integration-response.dto';
import { CredentialsCryptoService } from './credentials-crypto.service';

/**
 * One provider's demo connection state.
 *
 * The mix is chosen so the Couriers tab shows every state it can render:
 * a healthy default, a healthy secondary, one with a degraded success rate, and
 * one left disconnected so the "Connect" action is visible.
 */
interface DemoIntegration {
  provider: CourierProviderEnum;
  isEnabled: boolean;
  isDefault: boolean;
  apiCallsTotal: number;
  apiCallsFailed: number;
  autoCreateShipment: boolean;
  autoUpdateTracking: boolean;
  lastApiSyncMinutesAgo: number | null;
  lastWebhookMinutesAgo: number | null;
  credentials: Record<string, string>;
}

const DEMO_INTEGRATIONS: DemoIntegration[] = [
  {
    provider: CourierProviderEnum.STEADFAST,
    isEnabled: true,
    isDefault: true,
    apiCallsTotal: 640,
    apiCallsFailed: 9, // ≈98.6% — "Healthy"
    autoCreateShipment: true,
    autoUpdateTracking: true,
    lastApiSyncMinutesAgo: 12,
    lastWebhookMinutesAgo: 25,
    credentials: { apiKey: 'demo_sf_api_key_7f3a91', secretKey: 'demo_sf_secret_b42c8e' },
  },
  {
    provider: CourierProviderEnum.PATHAO,
    isEnabled: true,
    isDefault: false,
    apiCallsTotal: 412,
    apiCallsFailed: 14, // ≈96.6% — "Healthy"
    autoCreateShipment: false,
    autoUpdateTracking: true,
    lastApiSyncMinutesAgo: 48,
    lastWebhookMinutesAgo: null,
    credentials: {
      clientId: 'demo_pathao_client_2210',
      clientSecret: 'demo_pathao_secret_5c1d',
      username: 'demo.merchant@bitcommerce.test',
      password: 'demo_pathao_pass_9f2b',
    },
  },
  {
    provider: CourierProviderEnum.REDX,
    isEnabled: true,
    isDefault: false,
    apiCallsTotal: 128,
    apiCallsFailed: 21, // ≈83.6% — "Fair"
    autoCreateShipment: false,
    autoUpdateTracking: false,
    lastApiSyncMinutesAgo: 190,
    lastWebhookMinutesAgo: null,
    credentials: { apiKey: 'demo_redx_token_a17e44' },
  },
  {
    provider: CourierProviderEnum.PAPERFLY,
    isEnabled: false,
    isDefault: false,
    apiCallsTotal: 0,
    apiCallsFailed: 0, // never called — "N/A"
    autoCreateShipment: false,
    autoUpdateTracking: true,
    lastApiSyncMinutesAgo: null,
    lastWebhookMinutesAgo: null,
    credentials: {},
  },
];

/**
 * Seeds courier integrations so a fresh merchant can see the Couriers tab
 * populated instead of an empty table.
 *
 * The credentials written here are obvious placeholders, not real keys: every
 * adapter treats them as sandbox mode, so a seeded provider never issues a live
 * courier call. Like the shipment seeder, this is refused outright in
 * production.
 */
@Injectable()
export class SeedCourierDemoDataService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly credentialsCrypto: CredentialsCryptoService,
  ) {}

  async execute(tenantId: string): Promise<SeedCourierDemoDataResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Demo courier seeder is strictly disabled in production environments.',
      );
    }

    let integrationsCreated = 0;
    let integrationsSkipped = 0;

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CourierIntegrationEntity);
      const existing = await repository.find({ where: { tenantId } });
      const configuredProviders = new Set(existing.map((row) => row.provider));
      // Only claim the default slot when the merchant has no default already.
      const hasDefault = existing.some((row) => row.isDefault);

      for (const demo of DEMO_INTEGRATIONS) {
        // Seeding fills empty slots; it is never a reset button. An existing row
        // is left untouched — including a provider deliberately left without
        // credentials, which would otherwise be rewritten on every run and
        // reported as work that did not happen.
        if (configuredProviders.has(demo.provider)) {
          integrationsSkipped += 1;
          continue;
        }

        await repository.save(
          repository.create({
            tenantId,
            provider: demo.provider,
            isEnabled: demo.isEnabled,
            isDefault: demo.isDefault && !hasDefault,
            sandbox: true,
            autoCreateShipment: demo.autoCreateShipment,
            autoUpdateTracking: demo.autoUpdateTracking,
            apiCallsTotal: demo.apiCallsTotal,
            apiCallsFailed: demo.apiCallsFailed,
            encryptedCredentials: this.credentialsCrypto.encrypt(demo.credentials),
            lastApiSyncAt: this.minutesAgo(demo.lastApiSyncMinutesAgo),
            lastWebhookAt: this.minutesAgo(demo.lastWebhookMinutesAgo),
            lastTestedAt: demo.isEnabled ? this.minutesAgo(demo.lastApiSyncMinutesAgo) : null,
            lastTestSucceeded: demo.isEnabled ? true : null,
            lastTestMessage: demo.isEnabled ? 'Sandbox connection verified.' : null,
          }),
        );
        integrationsCreated += 1;
      }
    });

    return {
      success: true,
      message:
        integrationsCreated === 0
          ? 'All couriers are already configured — nothing to seed.'
          : `Seeded ${integrationsCreated} courier integration${
              integrationsCreated === 1 ? '' : 's'
            }.`,
      integrationsCreated,
      integrationsSkipped,
    };
  }

  private minutesAgo(minutes: number | null): Date | null {
    if (minutes === null) return null;
    return new Date(Date.now() - minutes * 60 * 1000);
  }
}
