import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductVariantsChunkNine1786730000000 implements MigrationInterface {
  name = 'AddProductVariantsChunkNine1786730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "hasVariants" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN IF NOT EXISTS "title" character varying(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "barcode" character varying(100),
      ADD COLUMN IF NOT EXISTS "costPrice" numeric(12,2),
      ADD COLUMN IF NOT EXISTS "imageId" uuid,
      ADD COLUMN IF NOT EXISTS "isEnabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "combinationKey" character varying(255),
      ADD COLUMN IF NOT EXISTS "options" jsonb NOT NULL DEFAULT '[]';
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants" ALTER COLUMN "sku" DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants" ALTER COLUMN "price" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP COLUMN IF EXISTS "options",
      DROP COLUMN IF EXISTS "combinationKey",
      DROP COLUMN IF EXISTS "isEnabled",
      DROP COLUMN IF EXISTS "imageId",
      DROP COLUMN IF EXISTS "costPrice",
      DROP COLUMN IF EXISTS "barcode",
      DROP COLUMN IF EXISTS "title";
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "hasVariants";
    `);
  }
}
