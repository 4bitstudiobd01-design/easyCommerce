import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING_PREFIX = 'v1';

@Injectable()
export class OmnichannelAiCryptoService {
  private readonly logger = new Logger(OmnichannelAiCryptoService.name);
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    const material =
      configured ??
      this.configService.get<string>(
        'JWT_SECRET',
        'bitcommerce_omnichannel_ai_key_secret_prod_fallback',
      );

    this.key = createHash('sha256').update(material).digest();
  }

  encrypt(plaintextKey?: string | null): string | null {
    if (!plaintextKey || typeof plaintextKey !== 'string' || plaintextKey.trim().length === 0) {
      return null;
    }

    const trimmed = plaintextKey.trim();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(trimmed, 'utf8'),
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

  decrypt(payload?: string | null): string | null {
    if (!payload || typeof payload !== 'string') return null;

    try {
      const [prefix, iv, authTag, ciphertext] = payload.split(':');
      if (prefix !== ENCODING_PREFIX || !iv || !authTag || !ciphertext) {
        throw new Error('Malformed encrypted payload');
      }

      const authTagBuffer = Buffer.from(authTag, 'base64');
      if (authTagBuffer.length !== AUTH_TAG_LENGTH) {
        throw new Error('Malformed auth tag length');
      }

      const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(authTagBuffer);

      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');

      return plaintext;
    } catch (err: any) {
      this.logger.error('Failed to decrypt AI API key payload. Key must be re-entered.');
      return null;
    }
  }

  maskKey(key?: string | null): string {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return '';
    }
    const trimmed = key.trim();
    if (trimmed.length <= 6) {
      return '••••••••';
    }
    const visible = trimmed.slice(-4);
    return `${'•'.repeat(Math.max(6, Math.min(12, trimmed.length - visible.length)))}${visible}`;
  }

  isMasked(value?: string | null): boolean {
    if (!value) return false;
    return value.includes('••••') || value.includes('****');
  }
}
