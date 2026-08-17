import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { CourierCredentialBag } from '../entities/courier-integration.entity';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING_PREFIX = 'v1';

/**
 * Encrypts courier credentials before they touch the database.
 *
 * Courier API keys let anyone book and cancel parcels on the merchant's
 * account, so they are treated as secrets rather than settings: AES-256-GCM
 * (authenticated, so a tampered ciphertext fails loudly instead of decrypting
 * to garbage), a fresh random IV per write, and the tag stored alongside.
 *
 * The key comes from CREDENTIALS_ENCRYPTION_KEY. When that is unset — local dev
 * that has never configured it — the service derives a key from JWT_SECRET so
 * the feature still works, and warns once. It never falls back to storing
 * plaintext.
 */
@Injectable()
export class CredentialsCryptoService {
  private readonly logger = new Logger(CredentialsCryptoService.name);
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');

    if (!configured) {
      this.logger.warn(
        'CREDENTIALS_ENCRYPTION_KEY is not set — deriving the courier credential key from JWT_SECRET. Set a dedicated key before production.',
      );
    }

    const material =
      configured ??
      this.configService.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod');

    // Hashing accepts a passphrase of any length while always yielding the
    // 32 bytes AES-256 requires.
    this.key = createHash('sha256').update(material).digest();
  }

  /**
   * Returns null for an empty bag so a provider saved without credentials
   * stores NULL rather than the ciphertext of "{}".
   */
  encrypt(credentials: CourierCredentialBag): string | null {
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

  /**
   * Never throws: a credential blob written under a rotated or lost key must
   * degrade to "this provider needs reconnecting", not a 500 that takes the
   * whole Couriers tab down.
   */
  decrypt(payload?: string | null): CourierCredentialBag {
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

      return JSON.parse(plaintext) as CourierCredentialBag;
    } catch {
      // Deliberately no payload in the log line — it is the secret itself.
      this.logger.error(
        'Failed to decrypt courier credentials. The merchant must reconnect this provider.',
      );
      return {};
    }
  }

  /**
   * What read endpoints return. Shows enough for the merchant to recognise the
   * key they saved ("••••••ab12") without ever putting a usable secret on the
   * wire.
   */
  mask(credentials: CourierCredentialBag): Record<string, string> {
    const masked: Record<string, string> = {};
    Object.entries(credentials).forEach(([field, value]) => {
      if (typeof value !== 'string' || value.length === 0) return;
      // baseUrl is a host, not a secret — masking it would only confuse.
      masked[field] = field === 'baseUrl' ? value : this.maskValue(value);
    });
    return masked;
  }

  /**
   * Merges an incoming partial update over what is stored, so a merchant can
   * change one field in the drawer without re-typing every secret. A field
   * submitted as the mask we sent them is treated as "unchanged".
   */
  merge(
    stored: CourierCredentialBag,
    incoming: CourierCredentialBag,
  ): CourierCredentialBag {
    const merged: CourierCredentialBag = { ...stored };

    Object.entries(incoming).forEach(([field, value]) => {
      const key = field as keyof CourierCredentialBag;

      // Explicitly cleared by the merchant.
      if (value === null || value === '') {
        delete merged[key];
        return;
      }
      if (typeof value !== 'string') return;

      const storedValue = stored[key];
      if (typeof storedValue === 'string' && this.isMaskOf(value, storedValue)) return;

      merged[key] = value;
    });

    return merged;
  }

  private maskValue(value: string): string {
    const visible = value.slice(-4);
    return `${'•'.repeat(Math.max(4, Math.min(12, value.length - visible.length)))}${visible}`;
  }

  /** Constant-time so this helper never becomes a way to probe a stored secret. */
  private isMaskOf(candidate: string, storedValue: string): boolean {
    const expected = Buffer.from(this.maskValue(storedValue));
    const actual = Buffer.from(candidate);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  private stripEmpty(credentials: CourierCredentialBag): CourierCredentialBag {
    const cleaned: CourierCredentialBag = {};
    Object.entries(credentials).forEach(([field, value]) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        cleaned[field as keyof CourierCredentialBag] = value.trim();
      }
    });
    return cleaned;
  }
}
