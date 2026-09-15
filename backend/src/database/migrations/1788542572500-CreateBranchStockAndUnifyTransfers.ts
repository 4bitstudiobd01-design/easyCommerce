import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchStockAndUnifyTransfers1788542572500 implements MigrationInterface {
  name = 'CreateBranchStockAndUnifyTransfers1788542572500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // branch_stocks — a branch's own independent stock ledger
    await queryRunner.query(`
      CREATE TABLE "branch_stocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "variantId" uuid,
        "branchId" uuid NOT NULL,
        "quantityOnHand" integer NOT NULL DEFAULT 0,
        "quantityReserved" integer NOT NULL DEFAULT 0,
        "reorderPoint" integer NOT NULL DEFAULT 5,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branch_stocks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "branch_stocks"
      ADD CONSTRAINT "FK_branch_stocks_productId"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "branch_stocks"
      ADD CONSTRAINT "FK_branch_stocks_variantId"
      FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "branch_stocks"
      ADD CONSTRAINT "FK_branch_stocks_branchId"
      FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`CREATE INDEX "IDX_branch_stocks_tenant_prod" ON "branch_stocks" ("tenantId", "productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_branch_stocks_tenant_branch" ON "branch_stocks" ("tenantId", "branchId")`);
    await queryRunner.query(`CREATE INDEX "IDX_branch_stocks_tenant_var" ON "branch_stocks" ("tenantId", "variantId")`);

    // stock_transfers — unify warehouse/branch as source & destination, add variant support
    await queryRunner.query(`ALTER TABLE "stock_transfers" ALTER COLUMN "fromWarehouseId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" ALTER COLUMN "toWarehouseId" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "stock_transfers" ADD COLUMN "fromBranchId" uuid`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" ADD COLUMN "toBranchId" uuid`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" ADD COLUMN "variantId" uuid`);

    await queryRunner.query(`
      ALTER TABLE "stock_transfers"
      ADD CONSTRAINT "FK_stock_transfers_fromBranchId"
      FOREIGN KEY ("fromBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "stock_transfers"
      ADD CONSTRAINT "FK_stock_transfers_toBranchId"
      FOREIGN KEY ("toBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "stock_transfers"
      ADD CONSTRAINT "FK_stock_transfers_variantId"
      FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`CREATE INDEX "IDX_stock_transfers_fromBranchId" ON "stock_transfers" ("fromBranchId")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_transfers_toBranchId" ON "stock_transfers" ("toBranchId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_transfers_toBranchId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_transfers_fromBranchId"`);

    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_stock_transfers_variantId"`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_stock_transfers_toBranchId"`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_stock_transfers_fromBranchId"`);

    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP COLUMN "variantId"`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP COLUMN "toBranchId"`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP COLUMN "fromBranchId"`);

    await queryRunner.query(`ALTER TABLE "stock_transfers" ALTER COLUMN "toWarehouseId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" ALTER COLUMN "fromWarehouseId" SET NOT NULL`);

    await queryRunner.query(`DROP INDEX "public"."IDX_branch_stocks_tenant_var"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_branch_stocks_tenant_branch"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_branch_stocks_tenant_prod"`);

    await queryRunner.query(`ALTER TABLE "branch_stocks" DROP CONSTRAINT "FK_branch_stocks_branchId"`);
    await queryRunner.query(`ALTER TABLE "branch_stocks" DROP CONSTRAINT "FK_branch_stocks_variantId"`);
    await queryRunner.query(`ALTER TABLE "branch_stocks" DROP CONSTRAINT "FK_branch_stocks_productId"`);

    await queryRunner.query(`DROP TABLE "branch_stocks"`);
  }
}
