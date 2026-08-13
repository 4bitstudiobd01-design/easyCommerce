import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductInventoryChunkEight1786720000000 implements MigrationInterface {
  name = 'AddProductInventoryChunkEight1786720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add inventory columns to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sku" character varying(100),
      ADD COLUMN IF NOT EXISTS "barcode" character varying(100),
      ADD COLUMN IF NOT EXISTS "trackInventory" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "allowBackorder" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lowStockThreshold" integer NOT NULL DEFAULT 10;
    `);

    // 2. Create inventory_movements table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "inventoryStockId" uuid,
        "type" character varying(50) NOT NULL DEFAULT 'ADJUSTMENT',
        "quantity" integer NOT NULL,
        "previousQuantity" integer NOT NULL,
        "newQuantity" integer NOT NULL,
        "reason" character varying(255) NOT NULL DEFAULT 'Manual Adjustment',
        "note" text,
        "referenceType" character varying(100),
        "referenceId" character varying(100),
        "createdBy" character varying(255),
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_prod" ON "inventory_movements" ("productId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_tenant" ON "inventory_movements" ("tenantId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_movements"`);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "lowStockThreshold",
      DROP COLUMN IF EXISTS "allowBackorder",
      DROP COLUMN IF EXISTS "trackInventory",
      DROP COLUMN IF EXISTS "barcode",
      DROP COLUMN IF EXISTS "sku";
    `);
  }
}
