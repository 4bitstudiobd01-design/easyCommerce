import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductDomainFoundationChunkOne1786670000000 implements MigrationInterface {
  name = 'AddProductDomainFoundationChunkOne1786670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add name column, copy title data, and drop NOT NULL on legacy title column
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "name" character varying(255)`);
    await queryRunner.query(`UPDATE "products" SET "name" = "title" WHERE "name" IS NULL OR "name" = ''`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "title" DROP NOT NULL`);

    // 2. Create productType enum type and add column
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "products_producttype_enum" AS ENUM('PHYSICAL', 'DIGITAL', 'SERVICE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "productType" "products_producttype_enum" NOT NULL DEFAULT 'PHYSICAL'`);

    // 3. Create status enum type and add column
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "products_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" "products_status_enum" NOT NULL DEFAULT 'DRAFT'`);
    await queryRunner.query(`UPDATE "products" SET "status" = 'ACTIVE' WHERE "isPublished" = true`);

    // 4. Create composite unique index on (tenantId, slug)
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_tenant_slug" ON "products" ("tenantId", "slug")`);

    // 5. Create performance composite indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_tenant_status" ON "products" ("tenantId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_tenant_type" ON "products" ("tenantId", "productType")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_slug"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "products_status_enum"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "productType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "products_producttype_enum"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "name"`);
  }
}
