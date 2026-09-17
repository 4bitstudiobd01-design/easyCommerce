import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PathaoAuthService } from './pathao-auth.service';
import { PathaoTokenEntity } from '../entities/pathao-token.entity';
import { CredentialsCryptoService } from './credentials-crypto.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://courier-api-sandbox.pathao.com';
const CREDS = {
  clientId: 'client-1',
  clientSecret: 'secret-1',
  username: 'merchant@test.com',
  password: 'pw',
};

describe('PathaoAuthService', () => {
  let service: PathaoAuthService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };
  let crypto: CredentialsCryptoService;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn((v) => Promise.resolve(v)),
      create: jest.fn((v) => v),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoAuthService,
        CredentialsCryptoService,
        { provide: ConfigService, useValue: new ConfigService({ CREDENTIALS_ENCRYPTION_KEY: 'test-key' }) },
        { provide: getRepositoryToken(PathaoTokenEntity), useValue: repo },
      ],
    }).compile();

    service = module.get(PathaoAuthService);
    crypto = module.get(CredentialsCryptoService);
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue(null);
    repo.save.mockImplementation((v) => Promise.resolve(v));
    repo.create.mockImplementation((v) => v);
  });

  it('issues a fresh token when nothing is cached and persists it', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'tok-1', refresh_token: 'refresh-1', expires_in: 432000 },
    });

    const token = await service.getValidAccessToken(TENANT, BASE_URL, false, CREDS);

    expect(token).toBe('tok-1');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/aladdin/api/v1/issue-token`,
      expect.objectContaining({ grant_type: 'password', client_id: 'client-1' }),
      expect.any(Object),
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.tenantId).toBe(TENANT);
    expect(saved.sandbox).toBe(false);
  });

  it('reuses a cached token that is not close to expiring, without calling Pathao', async () => {
    const encrypted = crypto.encrypt({ accessToken: 'cached-tok', refreshToken: 'cached-refresh' });
    repo.findOne.mockResolvedValue({
      tenantId: TENANT,
      sandbox: false,
      encryptedTokens: encrypted,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h from now
    });

    const token = await service.getValidAccessToken(TENANT, BASE_URL, false, CREDS);

    expect(token).toBe('cached-tok');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('refreshes via refresh_token when the cached token is near expiry', async () => {
    const encrypted = crypto.encrypt({ accessToken: 'stale-tok', refreshToken: 'refresh-1' });
    repo.findOne.mockResolvedValue({
      tenantId: TENANT,
      sandbox: false,
      encryptedTokens: encrypted,
      expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute from now — inside the safety margin
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'refreshed-tok', refresh_token: 'refresh-2', expires_in: 432000 },
    });

    const token = await service.getValidAccessToken(TENANT, BASE_URL, false, CREDS);

    expect(token).toBe('refreshed-tok');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/aladdin/api/v1/issue-token`,
      expect.objectContaining({ grant_type: 'refresh_token', refresh_token: 'refresh-1' }),
      expect.any(Object),
    );
  });

  it('falls back to a full re-issue when refresh fails', async () => {
    const encrypted = crypto.encrypt({ accessToken: 'stale-tok', refreshToken: 'bad-refresh' });
    repo.findOne.mockResolvedValue({
      tenantId: TENANT,
      sandbox: false,
      encryptedTokens: encrypted,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });
    mockedAxios.post
      .mockRejectedValueOnce(new Error('refresh rejected'))
      .mockResolvedValueOnce({
        data: { access_token: 'reissued-tok', refresh_token: 'refresh-new', expires_in: 432000 },
      });

    const token = await service.getValidAccessToken(TENANT, BASE_URL, false, CREDS);

    expect(token).toBe('reissued-tok');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('ignores a cached token issued for a different sandbox/production host', async () => {
    const encrypted = crypto.encrypt({ accessToken: 'sandbox-tok', refreshToken: 'r' });
    repo.findOne.mockResolvedValue({
      tenantId: TENANT,
      sandbox: true, // cached for sandbox
      encryptedTokens: encrypted,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'prod-tok', refresh_token: 'r2', expires_in: 432000 },
    });

    // Asking for production (sandbox=false) must not reuse the sandbox-cached token.
    const token = await service.getValidAccessToken(TENANT, BASE_URL, false, CREDS);

    expect(token).toBe('prod-tok');
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it('invalidate() deletes the cached row for the tenant', async () => {
    await service.invalidate(TENANT);
    expect(repo.delete).toHaveBeenCalledWith({ tenantId: TENANT });
  });
});
