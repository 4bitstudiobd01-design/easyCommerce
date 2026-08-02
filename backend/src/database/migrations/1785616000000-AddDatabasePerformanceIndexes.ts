import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabasePerformanceIndexes1785616000000 implements MigrationInterface {
  name = 'AddDatabasePerformanceIndexes1785616000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Stores Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stores_tenantId" ON "stores" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stores_slug" ON "stores" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stores_ownerId" ON "stores" ("ownerId")`,
    );

    // 2. Products Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_tenantId" ON "products" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_categoryId" ON "products" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_tenantId_slug" ON "products" ("tenantId", "slug")`,
    );

    // 3. Categories Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_tenantId" ON "categories" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_parentId" ON "categories" ("parentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_tenantId_slug" ON "categories" ("tenantId", "slug")`,
    );

    // 4. Orders Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId" ON "orders" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_storeSlug" ON "orders" ("storeSlug")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_orderStatus" ON "orders" ("orderStatus")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_customerPhone" ON "orders" ("customerPhone")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_createdAt" ON "orders" ("tenantId", "createdAt" DESC)`,
    );

    // 5. Payments Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_tenantId" ON "payments" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_tranId" ON "payments" ("tranId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_orderId" ON "payments" ("orderId")`,
    );

    // 6. Consignments Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consignments_tenantId" ON "consignments" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consignments_orderId" ON "consignments" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consignments_trackingCode" ON "consignments" ("trackingCode")`,
    );

    // 7. Inventory Stocks Table Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_tenantId" ON "inventory_stocks" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_warehouseId" ON "inventory_stocks" ("warehouseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_productId" ON "inventory_stocks" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_productId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_warehouseId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_trackingCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_orderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_orderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tranId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_tenantId_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_customerPhone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_orderStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_storeSlug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenantId_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenantId_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_categoryId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_ownerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_tenantId"`);
  }
}
