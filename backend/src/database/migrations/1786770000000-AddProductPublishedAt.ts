import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds products.publishedAt so the product details page can report when a product went
 * live. Without it the UI had to fall back to updatedAt, which changes on every edit
 * and therefore misreported the publish date.
 *
 * Existing published products are backfilled from createdAt — the closest truthful
 * value available for rows that predate this column.
 */
export class AddProductPublishedAt1786770000000 implements MigrationInterface {
  name = 'AddProductPublishedAt1786770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE;
    `);

    await queryRunner.query(`
      UPDATE "products"
      SET "publishedAt" = "createdAt"
      WHERE "publishedAt" IS NULL AND "status" = 'ACTIVE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "publishedAt";`);
  }
}
