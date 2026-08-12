import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranIdToThemePurchases1785955200000 implements MigrationInterface {
  name = 'AddTranIdToThemePurchases1785955200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "theme_purchases" ADD COLUMN IF NOT EXISTS "tranId" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "theme_purchases" ADD COLUMN IF NOT EXISTS "valId" character varying(100)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_theme_purchases_tranId" ON "theme_purchases" ("tranId") WHERE "tranId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_theme_purchases_tranId"`);
    await queryRunner.query(`ALTER TABLE "theme_purchases" DROP COLUMN IF EXISTS "valId"`);
    await queryRunner.query(`ALTER TABLE "theme_purchases" DROP COLUMN IF EXISTS "tranId"`);
  }
}
