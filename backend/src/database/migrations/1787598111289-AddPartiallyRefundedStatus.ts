import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartiallyRefundedStatus1787598111289 implements MigrationInterface {
    name = 'AddPartiallyRefundedStatus1787598111289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentstatus_enum" RENAME TO "orders_paymentstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "public"."orders_paymentstatus_enum" USING "paymentStatus"::"text"::"public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "text"`);
        await queryRunner.query(`UPDATE "orders" SET "paymentStatus" = 'REFUNDED' WHERE "paymentStatus" = 'PARTIALLY_REFUNDED'`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum_old" AS ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "public"."orders_paymentstatus_enum_old" USING "paymentStatus"::"text"::"public"."orders_paymentstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentstatus_enum_old" RENAME TO "orders_paymentstatus_enum"`);
    }

}
