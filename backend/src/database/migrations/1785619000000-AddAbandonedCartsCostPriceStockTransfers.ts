import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAbandonedCartsCostPriceStockTransfers1785619000000 implements MigrationInterface {
  name = 'AddAbandonedCartsCostPriceStockTransfers1785619000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add costPrice to products
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "costPrice" numeric(12,2) NULL`,
    );

    // 2. Create abandoned_carts table
    await queryRunner.query(
      `CREATE TABLE "abandoned_carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerName" character varying(255),
        "customerPhone" character varying(50) NOT NULL,
        "customerEmail" character varying(255),
        "shippingAddress" text,
        "itemsJson" jsonb NOT NULL,
        "totalAmount" numeric(12,2) NOT NULL,
        "recoveryToken" character varying(100) NOT NULL,
        "isRecovered" boolean NOT NULL DEFAULT false,
        "lastRemindedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_abandoned_carts_recoveryToken" UNIQUE ("recoveryToken"),
        CONSTRAINT "PK_abandoned_carts_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_abandoned_carts_tenantId" ON "abandoned_carts" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_abandoned_carts_customerPhone" ON "abandoned_carts" ("customerPhone")`,
    );

    // 3. Create stock_transfers table
    await queryRunner.query(
      `CREATE TABLE "stock_transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromWarehouseId" uuid NOT NULL,
        "toWarehouseId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "notes" text,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_transfers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_transfers_fromWarehouseId" FOREIGN KEY ("fromWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_stock_transfers_toWarehouseId" FOREIGN KEY ("toWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_stock_transfers_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_stock_transfers_tenantId" ON "stock_transfers" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_transfers_fromWarehouseId" ON "stock_transfers" ("fromWarehouseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_transfers_toWarehouseId" ON "stock_transfers" ("toWarehouseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_transfers_productId" ON "stock_transfers" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_stock_transfers_productId"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_transfers_toWarehouseId"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_transfers_fromWarehouseId"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_transfers_tenantId"`);
    await queryRunner.query(`DROP TABLE "stock_transfers"`);

    await queryRunner.query(`DROP INDEX "IDX_abandoned_carts_customerPhone"`);
    await queryRunner.query(`DROP INDEX "IDX_abandoned_carts_tenantId"`);
    await queryRunner.query(`DROP TABLE "abandoned_carts"`);

    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "costPrice"`);
  }
}
