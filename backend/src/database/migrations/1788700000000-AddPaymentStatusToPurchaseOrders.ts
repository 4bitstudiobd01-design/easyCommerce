import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentStatusToPurchaseOrders1788700000000 implements MigrationInterface {
  name = 'AddPaymentStatusToPurchaseOrders1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."pur_purchase_orders_paymentstatus_enum" AS ENUM('PENDING', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "pur_purchase_orders"
      ADD COLUMN IF NOT EXISTS "paymentStatus" "public"."pur_purchase_orders_paymentstatus_enum" NOT NULL DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pur_purchase_orders_storeId_paymentStatus"
      ON "pur_purchase_orders" ("storeId", "paymentStatus")
    `);

    // Backfill: orders that are already SENT, PARTIALLY_RECEIVED, or FULLY_RECEIVED are considered PAID
    await queryRunner.query(`
      UPDATE "pur_purchase_orders"
      SET "paymentStatus" = 'PAID'
      WHERE "status" IN ('APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED')
    `);

    // Migrate any lingering 'APPROVED' status directly to 'SENT'
    await queryRunner.query(`
      UPDATE "pur_purchase_orders"
      SET "status" = 'SENT'
      WHERE "status" = 'APPROVED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_pur_purchase_orders_storeId_paymentStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pur_purchase_orders" DROP COLUMN IF EXISTS "paymentStatus"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."pur_purchase_orders_paymentstatus_enum"`,
    );
  }
}
