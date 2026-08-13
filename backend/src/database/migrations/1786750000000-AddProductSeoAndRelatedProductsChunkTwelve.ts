import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSeoAndRelatedProductsChunkTwelve1786750000000 implements MigrationInterface {
  name = 'AddProductSeoAndRelatedProductsChunkTwelve1786750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add SEO columns to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "seoTitle" varchar(255),
      ADD COLUMN IF NOT EXISTS "metaDescription" text,
      ADD COLUMN IF NOT EXISTS "canonicalUrl" varchar(500),
      ADD COLUMN IF NOT EXISTS "isSearchEngineIndexed" boolean NOT NULL DEFAULT true;
    `);

    // 2. Create product_relations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_relations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "relatedProductId" uuid NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_relations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_relations_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_relations_related" FOREIGN KEY ("relatedProductId") REFERENCES "products"("id") ON DELETE CASCADE
      );
    `);

    // 3. Create Indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_relations_tenant_prod" ON "product_relations" ("tenantId", "productId");
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_relations_unique" ON "product_relations" ("tenantId", "productId", "relatedProductId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_relations";`);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "seoTitle",
      DROP COLUMN IF EXISTS "metaDescription",
      DROP COLUMN IF EXISTS "canonicalUrl",
      DROP COLUMN IF EXISTS "isSearchEngineIndexed";
    `);
  }
}
