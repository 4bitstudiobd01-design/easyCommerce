/**
 * Phase 0 data migration — run once, after MarketingPixelRedesign1788902057330.
 *
 *   npx ts-node -r tsconfig-paths/register src/scripts/backfill-marketing-pixels.ts
 *
 * Two idempotent passes:
 *   1. Give every existing `marketing_pixels` row a `label` if it has none
 *      ("Imported <Provider>"), so the new partial-unique (storeId, provider, label)
 *      index is satisfied and the multi-instance UI has a name to show.
 *   2. For each store that still carries legacy `stores.*PixelId` / `*CapiToken`
 *      values, create an equivalent `marketing_pixels` row (label
 *      "Imported <Provider>", pageScopeMode ALL, status CONNECTED) if one does not
 *      already exist for that (store, provider). Credentials are encrypted via the
 *      same key the app uses. The legacy columns are left in place (dropped in the
 *      cleanup phase).
 */
import 'reflect-metadata';
import { createHash, createCipheriv, randomBytes } from 'crypto';
import { AppDataSource } from '../database/data-source';

const PROVIDER_LABEL: Record<string, string> = {
  META: 'Imported Meta Pixel',
  GOOGLE_ANALYTICS: 'Imported Google Analytics 4',
  GOOGLE_ADS: 'Imported Google Ads',
  TIKTOK: 'Imported TikTok Pixel',
};

function encryptCredentials(bag: Record<string, string>): string | null {
  const cleaned = Object.fromEntries(
    Object.entries(bag).filter(([, v]) => typeof v === 'string' && v.trim().length > 0),
  );
  if (Object.keys(cleaned).length === 0) return null;

  const material =
    process.env.CREDENTIALS_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    'bitcommerce_jwt_secret_key_change_in_prod';
  const key = createHash('sha256').update(material).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(cleaned), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(
    ':',
  );
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();

  try {
    // --- Pass 1: label existing rows ---
    const labelled = await qr.query(
      `UPDATE "marketing_pixels"
         SET "label" = CASE "provider"
           WHEN 'META' THEN 'Imported Meta Pixel'
           WHEN 'GOOGLE_ANALYTICS' THEN 'Imported Google Analytics 4'
           WHEN 'GOOGLE_ADS' THEN 'Imported Google Ads'
           WHEN 'TIKTOK' THEN 'Imported TikTok Pixel'
           ELSE 'Imported Pixel'
         END
       WHERE "label" IS NULL
       RETURNING "id"`,
    );
    console.log(`Pass 1: labelled ${labelled.length} existing pixel row(s).`);

    // --- Pass 2: legacy store columns -> pixel rows ---
    // Guarded so it runs only if the legacy columns still exist on `stores`.
    const cols: { column_name: string }[] = await qr.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'stores'
          AND column_name IN ('facebookPixelId','facebookCapiToken','facebookTestEventCode',
                              'tiktokPixelId','googleAnalyticsId','googleAdsConversionId')`,
    );
    const has = new Set(cols.map((c) => c.column_name));
    if (has.size === 0) {
      console.log('Pass 2: legacy store pixel columns already removed — nothing to backfill.');
    } else {
      const select = [
        'id AS "storeId"',
        '"tenantId"',
        has.has('facebookPixelId') ? '"facebookPixelId"' : 'NULL AS "facebookPixelId"',
        has.has('facebookCapiToken') ? '"facebookCapiToken"' : 'NULL AS "facebookCapiToken"',
        has.has('facebookTestEventCode')
          ? '"facebookTestEventCode"'
          : 'NULL AS "facebookTestEventCode"',
        has.has('tiktokPixelId') ? '"tiktokPixelId"' : 'NULL AS "tiktokPixelId"',
        has.has('googleAnalyticsId') ? '"googleAnalyticsId"' : 'NULL AS "googleAnalyticsId"',
        has.has('googleAdsConversionId')
          ? '"googleAdsConversionId"'
          : 'NULL AS "googleAdsConversionId"',
      ].join(', ');

      const stores: any[] = await qr.query(`SELECT ${select} FROM "stores"`);
      let created = 0;

      for (const s of stores) {
        const candidates: { provider: string; pixelId?: string; creds: Record<string, string> }[] = [
          {
            provider: 'META',
            pixelId: s.facebookPixelId,
            creds: {
              accessToken: s.facebookCapiToken,
              testEventCode: s.facebookTestEventCode,
            },
          },
          { provider: 'TIKTOK', pixelId: s.tiktokPixelId, creds: {} },
          { provider: 'GOOGLE_ANALYTICS', pixelId: s.googleAnalyticsId, creds: {} },
          { provider: 'GOOGLE_ADS', pixelId: s.googleAdsConversionId, creds: {} },
        ];

        for (const c of candidates) {
          if (!c.pixelId || String(c.pixelId).trim().length === 0) continue;

          const existing = await qr.query(
            `SELECT 1 FROM "marketing_pixels" WHERE "storeId" = $1 AND "provider" = $2 LIMIT 1`,
            [s.storeId, c.provider],
          );
          if (existing.length > 0) continue;

          await qr.query(
            `INSERT INTO "marketing_pixels"
               ("tenantId", "storeId", "provider", "label", "pixelId",
                "credentialsEncrypted", "capiEnabled", "pageScopeMode", "status", "isActive")
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ALL', 'CONNECTED', true)`,
            [
              s.tenantId,
              s.storeId,
              c.provider,
              PROVIDER_LABEL[c.provider],
              String(c.pixelId).trim(),
              encryptCredentials(c.creds),
              c.provider === 'META' && c.creds.accessToken ? true : false,
            ],
          );
          created += 1;
        }
      }
      console.log(`Pass 2: created ${created} pixel row(s) from legacy store columns.`);
    }

    console.log('Backfill complete.');
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
