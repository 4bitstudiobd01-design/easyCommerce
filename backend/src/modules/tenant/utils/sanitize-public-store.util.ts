import { StoreEntity } from '../entities/store.entity';

/**
 * Secret/credential fields that must never reach an unauthenticated storefront
 * response. Keep in sync with StoreEntity — anything added there that isn't
 * meant for public consumption belongs in this list.
 */
const PRIVATE_STORE_FIELDS = [
  'ownerId',
  'facebookCapiToken',
  'steadfastApiKey',
  'steadfastSecretKey',
  'pathaoClientId',
  'pathaoClientSecret',
  'smsApiKey',
  'smtpHost',
  'smtpPort',
  'smtpUser',
  'smtpPass',
  'blockedIps',
  'blockedEmails',
  'maxCodOrdersPerIp',
  'maxOrdersPerDay',
] as const satisfies readonly (keyof StoreEntity)[];

/** Strips merchant-private credentials/config from a store before it is returned by a public endpoint. */
export function sanitizePublicStore(store: StoreEntity): StoreEntity {
  const sanitized = { ...store };
  for (const field of PRIVATE_STORE_FIELDS) {
    delete (sanitized as any)[field];
  }
  return sanitized as StoreEntity;
}
