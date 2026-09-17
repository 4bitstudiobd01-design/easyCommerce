import { ConfigService } from '@nestjs/config';
import { CourierCredentials } from './courier.adapter';

export const PAPERFLY_BASE_URL = 'https://api.paperfly.com.bd';

export interface PaperflyResolvedCreds {
  username: string;
  password: string;
  storeName: string;
}

/**
 * Shared with PaperflyExchangeService — both the adapter and the exchange
 * service authenticate against the same merchant Basic Auth + storeName, so
 * this is the one place that logic lives rather than being duplicated.
 */
export function resolvePaperflyCreds(
  input: CourierCredentials,
  configService: ConfigService,
): PaperflyResolvedCreds | null {
  const username = input.username || configService.get<string>('PAPERFLY_USERNAME');
  const password = input.password || configService.get<string>('PAPERFLY_PASSWORD');
  const storeName = input.apiKey || configService.get<string>('PAPERFLY_STORE_NAME');
  if (!username || !password || !storeName) return null;
  return { username, password, storeName };
}

export function paperflyAuthHeaders(
  username: string,
  password: string,
  configService: ConfigService,
): Record<string, string> {
  const basic = Buffer.from(`${username}:${password}`).toString('base64');
  // The doc's own literal value — a fixed, platform-wide key, not
  // per-merchant. Overridable via env for whenever Paperfly rotates it.
  const paperflyKey = configService.get<string>('PAPERFLY_KEY') || 'Paperfly_~La?Rj73FcLm';
  return {
    Authorization: `Basic ${basic}`,
    paperflykey: paperflyKey,
    'Content-Type': 'application/json',
  };
}
