import { sanitizePublicStore } from './sanitize-public-store.util';
import { StoreEntity } from '../entities/store.entity';

/**
 * The public storefront (unauthenticated) previously received the raw StoreEntity,
 * including courier/SMS/SMTP credentials and the owner's userId. Any endpoint that
 * serves store data to anonymous visitors must sanitize through this util first.
 */
describe('sanitizePublicStore', () => {
  const buildStore = (): StoreEntity =>
    ({
      id: 'store-1',
      name: 'Sumon Fashion',
      slug: 'sumon-fashion',
      logo: 'https://cdn.example.com/logo.png',
      primaryColor: '#2563eb',
      fontFamily: 'Inter',
      heroBanners: [],
      ownerId: 'owner-1',
      tenantId: 'tenant-1',
      facebookCapiToken: 'EAAG-secret',
      steadfastApiKey: 'sf-secret',
      steadfastSecretKey: 'sf-secret-2',
      pathaoClientId: 'pathao-id',
      pathaoClientSecret: 'pathao-secret',
      smsApiKey: 'sms-secret',
      smtpHost: 'smtp.mailtrap.io',
      smtpPort: 587,
      smtpUser: 'smtp-user',
      smtpPass: 'smtp-secret',
      blockedIps: ['1.2.3.4'],
      blockedEmails: ['abuse@example.com'],
      maxCodOrdersPerIp: 3,
      maxOrdersPerDay: 100,
    }) as StoreEntity;

  it('strips every merchant-private credential/config field', () => {
    const sanitized = sanitizePublicStore(buildStore());

    expect(sanitized).not.toHaveProperty('ownerId');
    expect(sanitized).not.toHaveProperty('facebookCapiToken');
    expect(sanitized).not.toHaveProperty('steadfastApiKey');
    expect(sanitized).not.toHaveProperty('steadfastSecretKey');
    expect(sanitized).not.toHaveProperty('pathaoClientId');
    expect(sanitized).not.toHaveProperty('pathaoClientSecret');
    expect(sanitized).not.toHaveProperty('smsApiKey');
    expect(sanitized).not.toHaveProperty('smtpHost');
    expect(sanitized).not.toHaveProperty('smtpPort');
    expect(sanitized).not.toHaveProperty('smtpUser');
    expect(sanitized).not.toHaveProperty('smtpPass');
    expect(sanitized).not.toHaveProperty('blockedIps');
    expect(sanitized).not.toHaveProperty('blockedEmails');
    expect(sanitized).not.toHaveProperty('maxCodOrdersPerIp');
    expect(sanitized).not.toHaveProperty('maxOrdersPerDay');
  });

  it('preserves public branding/theme fields needed by the storefront', () => {
    const sanitized = sanitizePublicStore(buildStore());

    expect(sanitized.id).toBe('store-1');
    expect(sanitized.name).toBe('Sumon Fashion');
    expect(sanitized.slug).toBe('sumon-fashion');
    expect(sanitized.logo).toBe('https://cdn.example.com/logo.png');
    expect(sanitized.primaryColor).toBe('#2563eb');
    expect(sanitized.fontFamily).toBe('Inter');
    expect(sanitized.tenantId).toBe('tenant-1');
  });

  it('does not mutate the original store object', () => {
    const store = buildStore();
    sanitizePublicStore(store);
    expect(store).toHaveProperty('smtpPass', 'smtp-secret');
  });
});
