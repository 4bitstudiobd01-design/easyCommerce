import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductOrganizationChunkFive1786690000000 implements MigrationInterface {
  name = 'AddProductOrganizationChunkFive1786690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Brands table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "logoUrl" text,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brands_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brands_tenant_slug" ON "brands" ("tenantId", "slug");
    `);

    // 2. Create Collections table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collections_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_collections_tenant_slug" ON "collections" ("tenantId", "slug");
    `);

    // 3. Add brandId to products table
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brandId" uuid`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_tenant_category" ON "products" ("tenantId", "categoryId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_tenant_brand" ON "products" ("tenantId", "brandId");
    `);

    // 4. Create product_collections join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_collections" (
        "productId" uuid NOT NULL,
        "collectionId" uuid NOT NULL,
        CONSTRAINT "PK_product_collections" PRIMARY KEY ("productId", "collectionId")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_collections_product" ON "product_collections" ("productId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_collections_collection" ON "product_collections" ("collectionId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_collections"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_brand"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "brandId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
  }
}
