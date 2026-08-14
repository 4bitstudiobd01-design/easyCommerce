import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryDomainFoundationChunkOne1786800000000 implements MigrationInterface {
  name = 'AddInventoryDomainFoundationChunkOne1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add CHECK constraints for non-negative quantities on inventory_stocks
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_inventory_stocks_on_hand') THEN
          ALTER TABLE "inventory_stocks" ADD CONSTRAINT "CHK_inventory_stocks_on_hand" CHECK ("quantityOnHand" >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_inventory_stocks_reserved') THEN
          ALTER TABLE "inventory_stocks" ADD CONSTRAINT "CHK_inventory_stocks_reserved" CHECK ("quantityReserved" >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_inventory_stocks_reorder_point') THEN
          ALTER TABLE "inventory_stocks" ADD CONSTRAINT "CHK_inventory_stocks_reorder_point" CHECK ("reorderPoint" >= 0);
        END IF;
      END $$;
    `);

    // 2. Add foreign key relation from inventory_stocks.variantId to product_variants.id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_inventory_stocks_variant') THEN
          ALTER TABLE "inventory_stocks"
          ADD CONSTRAINT "FK_inventory_stocks_variant"
          FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // 3. Add Partial Unique Indexes on inventory_stocks to prevent duplicate inventory records
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_inventory_stock_with_variant"
      ON "inventory_stocks" ("tenantId", "warehouseId", "productId", "variantId")
      WHERE "variantId" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_inventory_stock_null_variant"
      ON "inventory_stocks" ("tenantId", "warehouseId", "productId")
      WHERE "variantId" IS NULL;
    `);

    // 4. Add Multi-Tenant Query Indexes on inventory_stocks
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_tenant_prod" ON "inventory_stocks" ("tenantId", "productId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_tenant_wh" ON "inventory_stocks" ("tenantId", "warehouseId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_stocks_tenant_var" ON "inventory_stocks" ("tenantId", "variantId");
    `);

    // 5. Ensure inventory_movements has variantId and foreign keys / indexes
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD COLUMN IF NOT EXISTS "variantId" uuid;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_inventory_movements_variant') THEN
          ALTER TABLE "inventory_movements"
          ADD CONSTRAINT "FK_inventory_movements_variant"
          FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_inventory_movements_stock') THEN
          ALTER TABLE "inventory_movements"
          ADD CONSTRAINT "FK_inventory_movements_stock"
          FOREIGN KEY ("inventoryStockId") REFERENCES "inventory_stocks"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_var" ON "inventory_movements" ("variantId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_stock" ON "inventory_movements" ("inventoryStockId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_tenant_created" ON "inventory_movements" ("tenantId", "createdAt" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_movements_tenant_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_movements_stock"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_movements_var"`);

    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "FK_inventory_movements_stock"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "FK_inventory_movements_variant"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_tenant_var"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_tenant_wh"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_stocks_tenant_prod"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_unique_inventory_stock_null_variant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_unique_inventory_stock_with_variant"`);

    await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT IF EXISTS "FK_inventory_stocks_variant"`);
    await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT IF EXISTS "CHK_inventory_stocks_reorder_point"`);
    await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT IF EXISTS "CHK_inventory_stocks_reserved"`);
    await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT IF EXISTS "CHK_inventory_stocks_on_hand"`);
  }
}
