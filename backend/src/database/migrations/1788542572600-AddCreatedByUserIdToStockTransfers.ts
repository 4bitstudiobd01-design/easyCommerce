import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByUserIdToStockTransfers1788542572600 implements MigrationInterface {
  name = 'AddCreatedByUserIdToStockTransfers1788542572600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stock_transfers" ADD COLUMN "createdByUserId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_transfers_createdByUserId" ON "stock_transfers" ("createdByUserId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_transfers_createdByUserId"`);
    await queryRunner.query(`ALTER TABLE "stock_transfers" DROP COLUMN "createdByUserId"`);
  }
}
