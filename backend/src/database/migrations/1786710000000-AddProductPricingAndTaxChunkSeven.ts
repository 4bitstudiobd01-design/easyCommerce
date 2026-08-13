import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPricingAndTaxChunkSeven1786710000000 implements MigrationInterface {
  name = 'AddProductPricingAndTaxChunkSeven1786710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "isTaxInclusive" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "taxCategory" character varying(50) NOT NULL DEFAULT 'STANDARD_VAT',
      ADD COLUMN IF NOT EXISTS "discountType" character varying(50) NOT NULL DEFAULT 'NONE',
      ADD COLUMN IF NOT EXISTS "discountValue" numeric(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discountStartsAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "discountEndsAt" TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "discountEndsAt",
      DROP COLUMN IF EXISTS "discountStartsAt",
      DROP COLUMN IF EXISTS "discountValue",
      DROP COLUMN IF EXISTS "discountType",
      DROP COLUMN IF EXISTS "taxCategory",
      DROP COLUMN IF EXISTS "isTaxInclusive",
      DROP COLUMN IF EXISTS "taxRate";
    `);
  }
}
