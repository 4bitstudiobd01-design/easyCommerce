import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { PathaoTokenEntity } from '../entities/pathao-token.entity';
import { CredentialsCryptoService } from './credentials-crypto.service';

export interface PathaoAuthCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

/** Refresh proactively once a token is within this window of expiring. */
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000;

/**
 * Issues, caches and refreshes a tenant's Pathao OAuth2 access token.
 *
 * Per PATHAO_INTEGRATION_SPEC §3.3: persist `access_token` / `refresh_token` /
 * `expires_at` and reuse them rather than re-issuing on every call. This is the
 * only place in the module that calls Pathao's `issue-token` endpoint — every
 * adapter method goes through `getValidAccessToken()`.
 *
 * One cached token per tenant (see PathaoTokenEntity). A credential change or a
 * sandbox/production switch invalidates the cached row (its username/password
 * or host no longer match what issued it), so callers that hit a stale token
 * transparently fall through to a fresh `issue-token` call.
 */
@Injectable()
export class PathaoAuthService {
  private readonly logger = new Logger(PathaoAuthService.name);

  constructor(
    @InjectRepository(PathaoTokenEntity)
    private readonly tokenRepository: Repository<PathaoTokenEntity>,
    private readonly credentialsCrypto: CredentialsCryptoService,
  ) {}

  /**
   * Returns a valid bearer token for this tenant, issuing or refreshing one as
   * needed. `forceReissue` skips the cache entirely — used for the one retry
   * after a courier call comes back 401 (the cached token turned out to be
   * invalid despite not looking expired).
   */
  async getValidAccessToken(
    tenantId: string,
    baseUrl: string,
    sandbox: boolean,
    creds: PathaoAuthCredentials,
    forceReissue = false,
  ): Promise<string> {
    if (!forceReissue) {
      const cached = await this.tokenRepository.findOne({ where: { tenantId } });
      if (cached && cached.sandbox === sandbox) {
        const { accessToken, refreshToken } = this.credentialsCrypto.decrypt(
          cached.encryptedTokens,
        );
        const expiringSoon = cached.expiresAt.getTime() - Date.now() < EXPIRY_SAFETY_MARGIN_MS;

        if (accessToken && !expiringSoon) {
          return accessToken;
        }

        if (refreshToken) {
          try {
            return await this.refreshAndStore(tenantId, baseUrl, sandbox, creds, refreshToken);
          } catch (err) {
            this.logger.warn(
              `Pathao token refresh failed for tenant ${tenantId}, falling back to full re-issue: ${err?.message}`,
            );
            // Fall through to a full re-issue below.
          }
        }
      }
    }

    return this.issueAndStore(tenantId, baseUrl, sandbox, creds);
  }

  /** Drops the cached token so the next call re-issues from scratch. Used after a 401. */
  async invalidate(tenantId: string): Promise<void> {
    await this.tokenRepository.delete({ tenantId });
  }

  private async issueAndStore(
    tenantId: string,
    baseUrl: string,
    sandbox: boolean,
    creds: PathaoAuthCredentials,
  ): Promise<string> {
    const res = await axios.post(
      `${baseUrl}/aladdin/api/v1/issue-token`,
      {
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        username: creds.username,
        password: creds.password,
        grant_type: 'password',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );

    const accessToken = res.data?.access_token;
    const refreshToken = res.data?.refresh_token;
    const expiresInSec = Number(res.data?.expires_in);

    if (!accessToken) {
      throw new BadGatewayException('Unable to authenticate with Pathao courier service.');
    }

    await this.store(tenantId, sandbox, accessToken, refreshToken, expiresInSec);
    return accessToken;
  }

  private async refreshAndStore(
    tenantId: string,
    baseUrl: string,
    sandbox: boolean,
    creds: PathaoAuthCredentials,
    refreshToken: string,
  ): Promise<string> {
    const res = await axios.post(
      `${baseUrl}/aladdin/api/v1/issue-token`,
      {
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );

    const accessToken = res.data?.access_token;
    const newRefreshToken = res.data?.refresh_token;
    const expiresInSec = Number(res.data?.expires_in);

    if (!accessToken) {
      throw new BadGatewayException('Pathao token refresh did not return a new access token.');
    }

    await this.store(tenantId, sandbox, accessToken, newRefreshToken, expiresInSec);
    return accessToken;
  }

  private async store(
    tenantId: string,
    sandbox: boolean,
    accessToken: string,
    refreshToken: string | undefined,
    expiresInSec: number,
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + (Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec * 1000 : 0),
    );
    const encryptedTokens = this.credentialsCrypto.encrypt({ accessToken, refreshToken });

    const existing = await this.tokenRepository.findOne({ where: { tenantId } });
    await this.tokenRepository.save(
      this.tokenRepository.create({
        ...(existing ?? {}),
        tenantId,
        sandbox,
        encryptedTokens: encryptedTokens ?? '',
        expiresAt,
      }),
    );
  }
}
