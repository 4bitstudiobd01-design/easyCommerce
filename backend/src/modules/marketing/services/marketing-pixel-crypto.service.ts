import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING_PREFIX = 'v1';

/**
 * The provider secrets a merchant stores against a pixel. Not all keys apply to
 * every provider — Meta/TikTok use `accessToken` (+ optional `testEventCode`),
 * GA4 uses `apiSecret`, Google Ads uses the OAuth trio. Stored as one encrypted
 * JSON blob so a single column covers every provider.
 */
export interface PixelCredentialBag {
  accessToken?: string;
  apiSecret?: string;
  testEventCode?: string;
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

/**
 * AES-256-GCM at-rest encryption for marketing-pixel credentials.
 *
 * Deliberately a thin re-implementation of the same pattern already proven in
 * `logistics/CredentialsCryptoService` and `omnichannel-crypto.util.ts` — same
 * algorithm, same `v1:iv:tag:ciphertext` envelope, same key derivation from
 * `CREDENTIALS_ENCRYPTION_KEY` (falling back to `JWT_SECRET` in dev, never to
 * plaintext). Kept module-local rather than shared so the marketing module owns
 * its own credential shape.
 */
@Injectable()
export class MarketingPixelCryptoService {
  private readonly logger = new Logger(MarketingPixelCryptoService.name);
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!configured) {
      this.logger.warn(
        'CREDENTIALS_ENCRYPTION_KEY is not set — deriving the marketing pixel credential key from JWT_SECRET. Set a dedicated key before production.',
      );
    }
    const material =
      configured ??
      this.configService.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod');
    this.key = createHash('sha256').update(material).digest();
  }

  /** Returns null for an empty bag so a pixel without credentials stores NULL. */
  encrypt(credentials: PixelCredentialBag): string | null {
    const cleaned = this.stripEmpty(credentials);
    if (Object.keys(cleaned).length === 0) return null;

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(cleaned), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      ENCODING_PREFIX,
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  /** Never throws: a blob under a rotated/lost key degrades to "reconnect this pixel". */
  decrypt(payload?: string | null): PixelCredentialBag {
    if (!payload) return {};
    try {
      const [prefix, iv, authTag, ciphertext] = payload.split(':');
      if (prefix !== ENCODING_PREFIX || !iv || !authTag || !ciphertext) {
        throw new Error('Malformed credential payload');
      }
      const authTagBuffer = Buffer.from(authTag, 'base64');
      if (authTagBuffer.length !== AUTH_TAG_LENGTH) {
        throw new Error('Malformed authentication tag');
      }
      const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(authTagBuffer);
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
      return JSON.parse(plaintext) as PixelCredentialBag;
    } catch {
      this.logger.error(
        'Failed to decrypt marketing pixel credentials. The merchant must reconnect this pixel.',
      );
      return {};
    }
  }

  /** Which fields are present, without exposing any value — for `hasCredentials`-style flags. */
  presentFields(credentials: PixelCredentialBag): string[] {
    return Object.keys(this.stripEmpty(credentials));
  }

  /**
   * Merges an incoming partial update over what is stored, so a merchant can change
   * one secret in the drawer without re-typing the rest. A field sent as `null` or
   * `''` is an explicit clear.
   */
  merge(stored: PixelCredentialBag, incoming: PixelCredentialBag): PixelCredentialBag {
    const merged: PixelCredentialBag = { ...stored };
    (Object.entries(incoming) as [keyof PixelCredentialBag, unknown][]).forEach(
      ([field, value]) => {
        if (value === null || value === '') {
          delete merged[field];
          return;
        }
        if (typeof value !== 'string') return;
        merged[field] = value.trim();
      },
    );
    return merged;
  }

  private stripEmpty(credentials: PixelCredentialBag): PixelCredentialBag {
    const cleaned: PixelCredentialBag = {};
    (Object.entries(credentials) as [keyof PixelCredentialBag, unknown][]).forEach(
      ([field, value]) => {
        if (typeof value === 'string' && value.trim().length > 0) {
          cleaned[field] = value.trim();
        }
      },
    );
    return cleaned;
  }
}
