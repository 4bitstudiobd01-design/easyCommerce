import { Logger } from '@nestjs/common';
import { ValueTransformer } from 'typeorm';
import {
  decryptWithSharedKey,
  encryptWithSharedKey,
} from '../services/omnichannel-crypto.util';

const logger = new Logger('OmnichannelCredentialTransformer');

/**
 * Encrypted envelope shape persisted in the `credentials` jsonb column.
 * `payload` is the AES-256-GCM string produced by omnichannel-crypto.util
 * ("v1:<iv>:<authTag>:<ciphertext>", all base64) over the JSON-stringified
 * credentials object.
 */
interface EncryptedCredentialsEnvelope {
  enc: true;
  payload: string;
}

function isEncryptedEnvelope(value: unknown): value is EncryptedCredentialsEnvelope {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).enc === true &&
    typeof (value as Record<string, unknown>).payload === 'string'
  );
}

/**
 * Encrypts/decrypts OmnichannelCredentialEntity.credentials at the ORM
 * boundary (AES-256-GCM, via the shared crypto util) so plaintext
 * tokens/secrets never reach the database, regardless of which repository
 * call (find/findOne/save, including direct repo access that bypasses
 * OmnichannelCredentialsService) touches the row.
 *
 * Column transformers run outside the Nest DI container, so this reads key
 * material straight from process.env via the shared util rather than
 * injecting OmnichannelAiCryptoService.
 *
 * Legacy plaintext rows (written before this transformer existed) are
 * passed through as-is on read so pre-existing dev data doesn't crash —
 * see the security fix report for this heads-up.
 */
export const credentialsColumnTransformer: ValueTransformer = {
  to(value: Record<string, any> | null | undefined): EncryptedCredentialsEnvelope | Record<string, any> {
    if (!value || Object.keys(value).length === 0) {
      return value ?? {};
    }

    const payload = encryptWithSharedKey(JSON.stringify(value));
    if (!payload) {
      return value;
    }

    return { enc: true, payload };
  },

  from(value: unknown): Record<string, any> {
    if (!value) return {};

    if (isEncryptedEnvelope(value)) {
      const decrypted = decryptWithSharedKey(value.payload);
      if (decrypted === null) {
        logger.error(
          'Failed to decrypt stored channel credentials; returning empty object.',
        );
        return {};
      }
      try {
        return JSON.parse(decrypted);
      } catch {
        logger.error('Decrypted channel credentials payload is not valid JSON.');
        return {};
      }
    }

    // Legacy plaintext row (pre-encryption) or already a plain object.
    return value as Record<string, any>;
  },
};
