import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountToOrders1786000000000 implements MigrationInterface {
  name = 'AddDiscountToOrders1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "couponCode" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "couponCode"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "discountAmount"`);
  }
}
