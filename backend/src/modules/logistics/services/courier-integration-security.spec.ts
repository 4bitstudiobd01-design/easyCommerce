import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CredentialsCryptoService } from './credentials-crypto.service';
import { CourierIntegrationMapperService } from './courier-integration-mapper.service';
import { ListCourierIntegrationsService } from './list-courier-integrations.service';
import { GetCourierIntegrationService } from './get-courier-integration.service';
import { UpsertCourierIntegrationService } from './upsert-courier-integration.service';
import { ToggleCourierIntegrationService } from './toggle-courier-integration.service';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ConsignmentEntity, CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const config = new ConfigService({ CREDENTIALS_ENCRYPTION_KEY: 'test-key-for-courier-specs' });

const buildRegistry = (): CourierProviderRegistry => {
  const makeAdapter = (provider: CourierProviderEnum, displayName: string) =>
    ({
      provider,
      displayName,
      profile: {
        serviceType: 'Courier Service',
        codSupport: true,
        coverage: 'All Over Bangladesh',
        website: `${displayName.toLowerCase()}.test`,
        supportsCancellation: true,
        supportsTracking: true,
        credentialFields: [
          { key: 'apiKey', label: 'API Key', secret: true, required: true },
          { key: 'secretKey', label: 'Secret Key', secret: true, required: false },
        ],
      },
      bookParcel: jest.fn(),
      trackParcel: jest.fn(),
      cancelParcel: jest.fn(),
      testConnection: jest.fn().mockResolvedValue({ success: true, message: 'ok' }),
    }) as any;

  return new CourierProviderRegistry(
    makeAdapter(CourierProviderEnum.STEADFAST, 'Steadfast'),
    makeAdapter(CourierProviderEnum.PATHAO, 'Pathao'),
    makeAdapter(CourierProviderEnum.PAPERFLY, 'Paperfly'),
    makeAdapter(CourierProviderEnum.REDX, 'RedX'),
    makeAdapter(CourierProviderEnum.PARCELDEX, 'Parceldex'),
    makeAdapter(CourierProviderEnum.CARRYBEE, 'Carrybee'),
  );
};

const makeStatsQueryBuilder = (recorder: { where: any[][]; andWhere: any[][] }) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    where: jest.fn((...args: any[]) => {
      recorder.where.push(args);
      return qb;
    }),
    andWhere: jest.fn((...args: any[]) => {
      recorder.andWhere.push(args);
      return qb;
    }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ shipments: '0', delivered: '0', concluded: '0' }),
  };
  return qb;
};

describe('Courier integration security and tenant isolation', () => {
  describe('CredentialsCryptoService', () => {
    const crypto = new CredentialsCryptoService(config);

    it('round-trips credentials through encryption', () => {
      const encrypted = crypto.encrypt({ apiKey: 'sk_live_abcd1234', secretKey: 'shh' });

      expect(encrypted).toBeTruthy();
      // The plaintext must not be recoverable by reading the stored column.
      expect(encrypted).not.toContain('sk_live_abcd1234');
      expect(crypto.decrypt(encrypted)).toEqual({
        apiKey: 'sk_live_abcd1234',
        secretKey: 'shh',
      });
    });

    it('produces a different ciphertext each time for the same input', () => {
      const first = crypto.encrypt({ apiKey: 'same-value' });
      const second = crypto.encrypt({ apiKey: 'same-value' });

      // A fixed IV would let an observer tell that two merchants share a key.
      expect(first).not.toEqual(second);
    });

    it('refuses to decrypt tampered ciphertext instead of returning garbage', () => {
      const encrypted = crypto.encrypt({ apiKey: 'sk_live_abcd1234' })!;
      const [prefix, iv, tag, body] = encrypted.split(':');
      const tampered = [prefix, iv, tag, Buffer.from('evil').toString('base64')].join(':');

      expect(crypto.decrypt(tampered)).toEqual({});
    });

    it('stores nothing for an empty credential bag', () => {
      expect(crypto.encrypt({})).toBeNull();
      expect(crypto.encrypt({ apiKey: '   ' })).toBeNull();
    });

    it('never reveals a usable secret when masking', () => {
      const masked = crypto.mask({ apiKey: 'sk_live_abcd1234', baseUrl: 'https://api.test' });

      expect(masked.apiKey).not.toContain('sk_live');
      expect(masked.apiKey.endsWith('1234')).toBe(true);
      // A base URL is a host, not a secret — masking it would only confuse.
      expect(masked.baseUrl).toBe('https://api.test');
    });

    it('treats a resubmitted mask as "unchanged" rather than overwriting the secret', () => {
      const stored = { apiKey: 'sk_live_abcd1234' };
      const masked = crypto.mask(stored);

      expect(crypto.merge(stored, { apiKey: masked.apiKey })).toEqual(stored);
    });

    it('applies a genuinely new value and clears an emptied field', () => {
      const stored = { apiKey: 'old-key', secretKey: 'old-secret' };

      expect(crypto.merge(stored, { apiKey: 'new-key' })).toEqual({
        apiKey: 'new-key',
        secretKey: 'old-secret',
      });
      expect(crypto.merge(stored, { secretKey: '' })).toEqual({ apiKey: 'old-key' });
    });
  });

  describe('ListCourierIntegrationsService', () => {
    let service: ListCourierIntegrationsService;
    let recorder: { where: any[][]; andWhere: any[][] };
    let integrationRepo: any;

    beforeEach(async () => {
      recorder = { where: [], andWhere: [] };
      integrationRepo = { find: jest.fn().mockResolvedValue([]) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ListCourierIntegrationsService,
          CourierIntegrationMapperService,
          { provide: CredentialsCryptoService, useValue: new CredentialsCryptoService(config) },
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          { provide: getRepositoryToken(CourierIntegrationEntity), useValue: integrationRepo },
          {
            provide: getRepositoryToken(ConsignmentEntity),
            useValue: { createQueryBuilder: jest.fn(() => makeStatsQueryBuilder(recorder)) },
          },
        ],
      }).compile();

      service = module.get(ListCourierIntegrationsService);
    });

    it('scopes both the integrations and the shipment stats to the caller', async () => {
      await service.execute(TENANT_A);

      expect(integrationRepo.find).toHaveBeenCalledWith({ where: { tenantId: TENANT_A } });

      const tenantParams = [...recorder.where, ...recorder.andWhere]
        .map(([, params]) => params?.tenantId)
        .filter(Boolean);
      expect(tenantParams.length).toBeGreaterThan(0);
      expect(tenantParams.every((id) => id === TENANT_A)).toBe(true);
      expect(tenantParams).not.toContain(TENANT_B);
    });

    it('lists every supported provider, including ones never connected', async () => {
      const result = await service.execute(TENANT_A);

      expect(result.couriers).toHaveLength(4);
      expect(result.summary.totalCouriers.count).toBe(4);
      // Nothing connected yet — and no invented trend percentages.
      expect(result.summary.connected.count).toBe(0);
      expect(result.summary.connected.change).toBeNull();
    });

    it('never returns a raw credential in the dashboard payload', async () => {
      const crypto = new CredentialsCryptoService(config);
      integrationRepo.find.mockResolvedValue([
        {
          id: 'int-1',
          tenantId: TENANT_A,
          provider: CourierProviderEnum.STEADFAST,
          isEnabled: true,
          isDefault: true,
          encryptedCredentials: crypto.encrypt({ apiKey: 'sk_live_secret_9999' }),
          apiCallsTotal: 100,
          apiCallsFailed: 1,
        },
      ]);

      const result = await service.execute(TENANT_A);

      expect(JSON.stringify(result)).not.toContain('sk_live_secret_9999');
      const steadfast = result.couriers.find(
        (c) => c.code === CourierProviderEnum.STEADFAST,
      )!;
      expect(steadfast.hasCredentials).toBe(true);
      expect(steadfast.maskedCredentials.apiKey).not.toContain('sk_live');
      expect((steadfast as any).encryptedCredentials).toBeUndefined();
    });

    it('reports health as N/A for a provider that has never been called', async () => {
      const result = await service.execute(TENANT_A);

      expect(result.couriers.every((courier) => courier.apiHealth === 'N/A')).toBe(true);
      expect(result.summary.apiHealth.rate).toBe(0);
    });
  });

  describe('UpsertCourierIntegrationService', () => {
    let service: UpsertCourierIntegrationService;
    let repository: any;
    let saved: any;

    beforeEach(async () => {
      saved = undefined;
      repository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data: any) => data),
        save: jest.fn(async (data: any) => {
          saved = data;
          return { id: 'int-1', ...data };
        }),
        update: jest.fn(),
      };

      const manager = { getRepository: jest.fn(() => repository) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UpsertCourierIntegrationService,
          { provide: CredentialsCryptoService, useValue: new CredentialsCryptoService(config) },
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          { provide: getRepositoryToken(CourierIntegrationEntity), useValue: repository },
          {
            provide: DataSource,
            useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
          },
          {
            provide: GetCourierIntegrationService,
            useValue: { execute: jest.fn().mockResolvedValue({}) },
          },
        ],
      }).compile();

      service = module.get(UpsertCourierIntegrationService);
    });

    it('always writes the caller’s tenant id, never one supplied elsewhere', async () => {
      await service.execute(CourierProviderEnum.STEADFAST, TENANT_A, {
        credentials: { apiKey: 'key-1' },
        isEnabled: true,
      });

      expect(saved.tenantId).toBe(TENANT_A);
    });

    it('encrypts credentials before they reach the repository', async () => {
      await service.execute(CourierProviderEnum.STEADFAST, TENANT_A, {
        credentials: { apiKey: 'plaintext-key-1234' },
        isEnabled: true,
      });

      expect(saved.encryptedCredentials).not.toContain('plaintext-key-1234');
      expect(new CredentialsCryptoService(config).decrypt(saved.encryptedCredentials)).toEqual({
        apiKey: 'plaintext-key-1234',
      });
    });

    it('refuses to enable a provider whose required credentials are missing', async () => {
      await expect(
        service.execute(CourierProviderEnum.STEADFAST, TENANT_A, { isEnabled: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores credentials without enabling when the merchant only saves them', async () => {
      await service.execute(CourierProviderEnum.STEADFAST, TENANT_A, {
        credentials: { apiKey: 'key-1' },
      });

      expect(saved.isEnabled).toBe(false);
      expect(saved.isDefault).toBe(false);
    });

    it('invalidates a stale passing test result when credentials change', async () => {
      repository.findOne.mockResolvedValue({
        id: 'int-1',
        tenantId: TENANT_A,
        provider: CourierProviderEnum.STEADFAST,
        isEnabled: true,
        encryptedCredentials: new CredentialsCryptoService(config).encrypt({ apiKey: 'old' }),
        lastTestSucceeded: true,
        lastTestMessage: 'Connected',
      });

      await service.execute(CourierProviderEnum.STEADFAST, TENANT_A, {
        credentials: { apiKey: 'brand-new-key' },
      });

      expect(saved.lastTestSucceeded).toBeNull();
      expect(saved.lastTestMessage).toBeNull();
    });

    it('rejects an unsupported provider before touching the database', async () => {
      await expect(
        service.execute('DHL' as CourierProviderEnum, TENANT_A, { isEnabled: true }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('ToggleCourierIntegrationService', () => {
    let service: ToggleCourierIntegrationService;
    let repository: any;

    const buildService = async (integration: any) => {
      repository = {
        findOne: jest.fn().mockResolvedValue(integration),
        save: jest.fn(async (data: any) => data),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ToggleCourierIntegrationService,
          { provide: CredentialsCryptoService, useValue: new CredentialsCryptoService(config) },
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          { provide: getRepositoryToken(CourierIntegrationEntity), useValue: repository },
          {
            provide: GetCourierIntegrationService,
            useValue: { execute: jest.fn().mockResolvedValue({}) },
          },
        ],
      }).compile();

      return module.get(ToggleCourierIntegrationService);
    };

    it("hides another merchant's integration behind a 404", async () => {
      service = await buildService(null);

      await expect(
        service.execute(CourierProviderEnum.STEADFAST, TENANT_B, true),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: TENANT_B, provider: CourierProviderEnum.STEADFAST },
      });
    });

    it('clears the default flag when a provider is switched off', async () => {
      const integration = {
        id: 'int-1',
        tenantId: TENANT_A,
        provider: CourierProviderEnum.STEADFAST,
        isEnabled: true,
        isDefault: true,
        encryptedCredentials: new CredentialsCryptoService(config).encrypt({ apiKey: 'k' }),
      };
      service = await buildService(integration);

      await service.execute(CourierProviderEnum.STEADFAST, TENANT_A, false);

      expect(integration.isEnabled).toBe(false);
      // A disconnected courier must not stay the booking default.
      expect(integration.isDefault).toBe(false);
    });

    it('refuses to enable an integration that has no credentials', async () => {
      service = await buildService({
        id: 'int-1',
        tenantId: TENANT_A,
        provider: CourierProviderEnum.STEADFAST,
        isEnabled: false,
        isDefault: false,
        encryptedCredentials: null,
      });

      await expect(
        service.execute(CourierProviderEnum.STEADFAST, TENANT_A, true),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
