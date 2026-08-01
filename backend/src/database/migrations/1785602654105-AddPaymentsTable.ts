import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentsTable1785602654105 implements MigrationInterface {
    name = 'AddPaymentsTable1785602654105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "orderNumber" character varying(50) NOT NULL, "tranId" character varying(100) NOT NULL, "valId" character varying(100), "amount" numeric(12,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'BDT', "cardType" character varying(100), "bankTranId" character varying(100), "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f0d96c36191806c4067604b6391" UNIQUE ("tranId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentmethod_enum" RENAME TO "orders_paymentmethod_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentmethod_enum" AS ENUM('COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "public"."orders_paymentmethod_enum" USING "paymentMethod"::"text"::"public"."orders_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'COD'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentmethod_enum_old" AS ENUM('COD', 'BKASH', 'NAGAD')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "public"."orders_paymentmethod_enum_old" USING "paymentMethod"::"text"::"public"."orders_paymentmethod_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'COD'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentmethod_enum_old" RENAME TO "orders_paymentmethod_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    }

}
