import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 6 cleanup — the flat marketing-pixel columns on `stores` are superseded
 * by the `marketing_pixels` table (multi-instance, per-page rules, encrypted CAPI
 * credentials). `backfill-marketing-pixels.ts` copied any non-null value into a
 * `marketing_pixels` row before this runs.
 *
 * `down` re-adds the columns (empty) so a rollback restores the schema shape,
 * but the data is not restored — it lives in `marketing_pixels` from here on.
 */
export class DropLegacyStorePixelColumns1788905900000 implements MigrationInterface {
  name = 'DropLegacyStorePixelColumns1788905900000';

  private readonly columns: [string, string][] = [
    ['facebookPixelId', 'character varying(255)'],
    ['facebookCapiToken', 'text'],
    ['facebookTestEventCode', 'character varying(100)'],
    ['tiktokPixelId', 'character varying(255)'],
    ['googleTagManagerId', 'character varying(255)'],
    ['googleAnalyticsId', 'character varying(255)'],
    ['snapchatPixelId', 'character varying(255)'],
    ['pinterestTagId', 'character varying(255)'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [col] of this.columns) {
      await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "${col}"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [col, type] of this.columns) {
      await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
    }
  }
}
