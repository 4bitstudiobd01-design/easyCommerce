import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces SKU uniqueness for products and variants, and adds the indexes the
 * product list/analytics queries rely on.
 *
 * The variant indexes are declared on ProductVariantEntity but were never emitted
 * as a migration, so the database accepted duplicate variant SKUs and duplicate
 * option combinations. Product SKU had no uniqueness rule at all, which let CSV
 * import and the create/update endpoints produce colliding SKUs within a tenant.
 *
 * All indexes are partial (`WHERE sku IS NOT NULL`) so the many products that
 * legitimately carry no SKU do not collide with each other on NULL.
 */
export class AddProductSkuUniquenessAndAnalyticsIndexes1786760000000 implements MigrationInterface {
  name = 'AddProductSkuUniquenessAndAnalyticsIndexes1786760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // De-duplicate any pre-existing product SKUs before enforcing the constraint,
    // keeping the oldest row and suffixing later collisions so the migration cannot
    // fail on live data.
    await queryRunner.query(`
      WITH ranked AS (
        SELECT "id", "sku",
               ROW_NUMBER() OVER (PARTITION BY "tenantId", "sku" ORDER BY "createdAt", "id") AS rn
        FROM "products"
        WHERE "sku" IS NOT NULL AND "sku" <> ''
      )
      UPDATE "products" p
      SET "sku" = p."sku" || '-DUP-' || ranked.rn
      FROM ranked
      WHERE p."id" = ranked."id" AND ranked.rn > 1;
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT "id", "sku",
               ROW_NUMBER() OVER (PARTITION BY "tenantId", "sku" ORDER BY "createdAt", "id") AS rn
        FROM "product_variants"
        WHERE "sku" IS NOT NULL AND "sku" <> ''
      )
      UPDATE "product_variants" v
      SET "sku" = v."sku" || '-DUP-' || ranked.rn
      FROM ranked
      WHERE v."id" = ranked."id" AND ranked.rn > 1;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_tenant_sku"
      ON "products" ("tenantId", "sku") WHERE "sku" IS NOT NULL AND "sku" <> '';
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variants_tenant_sku"
      ON "product_variants" ("tenantId", "sku") WHERE "sku" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variants_prod_comb"
      ON "product_variants" ("productId", "combinationKey") WHERE "combinationKey" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variants_prod_id" ON "product_variants" ("productId");
      CREATE INDEX IF NOT EXISTS "IDX_product_variants_tenant_id" ON "product_variants" ("tenantId");
    `);

    // Supports the product list stock filter and the per-product analytics rollups,
    // both of which scan inventory/order rows by product within a tenant.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_tenant_product"
      ON "inventory_stocks" ("tenantId", "productId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_items_tenant_product"
      ON "order_items" ("tenantId", "productId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_tenant_product";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_tenant_product";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_tenant_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_prod_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_prod_comb";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_tenant_sku";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenant_sku";`);
  }
}
