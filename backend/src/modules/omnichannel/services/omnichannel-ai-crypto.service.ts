import { Injectable, Logger } from '@nestjs/common';
import { decryptWithSharedKey, encryptWithSharedKey } from './omnichannel-crypto.util';

/**
 * Thin DI-friendly wrapper around the shared AES-256-GCM helpers in
 * `omnichannel-crypto.util.ts`. Kept as an injectable service (rather than
 * calling the util directly) so it can continue to be constructor-injected
 * wherever a Nest DI context is available (AI provider keys, credentials
 * service). TypeORM column transformers, which run outside the Nest DI
 * container, call the shared util functions directly instead — see
 * `entities/omnichannel-credential.transformer.ts`.
 */
@Injectable()
export class OmnichannelAiCryptoService {
  private readonly logger = new Logger(OmnichannelAiCryptoService.name);

  encrypt(plaintextKey?: string | null): string | null {
    return encryptWithSharedKey(plaintextKey);
  }

  decrypt(payload?: string | null): string | null {
    const result = decryptWithSharedKey(payload);
    if (payload && !result) {
      this.logger.error('Failed to decrypt AI API key payload. Key must be re-entered.');
    }
    return result;
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
