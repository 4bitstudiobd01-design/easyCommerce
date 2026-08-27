import { Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING_PREFIX = 'v1';

const logger = new Logger('OmnichannelCryptoUtil');

/**
 * Framework-agnostic AES-256-GCM helpers shared by OmnichannelAiCryptoService
 * (DI-based, used wherever a ConfigService instance is available) and by
 * TypeORM column transformers (which run outside the Nest DI container, so
 * they read the key material straight from process.env).
 *
 * Do not duplicate this logic elsewhere — both call sites must derive the
 * same key from the same env vars or ciphertexts become mutually unreadable.
 */
function resolveKey(): Buffer {
  const material =
    process.env.CREDENTIALS_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    'bitcommerce_omnichannel_ai_key_secret_prod_fallback';

  return createHash('sha256').update(material).digest();
}

export function encryptWithSharedKey(plaintext?: string | null): string | null {
  if (!plaintext || typeof plaintext !== 'string' || plaintext.trim().length === 0) {
    return null;
  }

  const key = resolveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCODING_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decryptWithSharedKey(payload?: string | null): string | null {
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

    const key = resolveKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(authTagBuffer);

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    logger.error('Failed to decrypt payload with shared omnichannel key.');
    return null;
  }
}
