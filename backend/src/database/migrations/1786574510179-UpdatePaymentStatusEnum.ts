import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentStatusEnum1786574510179 implements MigrationInterface {
    name = 'UpdatePaymentStatusEnum1786574510179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "consignment_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "consignmentId" uuid NOT NULL, "status" character varying(50) NOT NULL, "eventTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "location" character varying(255), "description" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fce5afac235566444213ee91834" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "consignments" ADD "lastSyncAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentstatus_enum" RENAME TO "orders_paymentstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('UNPAID', 'PAID', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "public"."orders_paymentstatus_enum" USING "paymentStatus"::"text"::"public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."consignments_status_enum" RENAME TO "consignments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."consignments_status_enum" AS ENUM('BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" TYPE "public"."consignments_status_enum" USING "status"::"text"::"public"."consignments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" SET DEFAULT 'BOOKED'`);
        await queryRunner.query(`DROP TYPE "public"."consignments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "consignment_events" ADD CONSTRAINT "FK_d03c1ce69bd88e7834da4cc9121" FOREIGN KEY ("consignmentId") REFERENCES "consignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consignment_events" DROP CONSTRAINT "FK_d03c1ce69bd88e7834da4cc9121"`);
        await queryRunner.query(`CREATE TYPE "public"."consignments_status_enum_old" AS ENUM('BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" TYPE "public"."consignments_status_enum_old" USING "status"::"text"::"public"."consignments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "status" SET DEFAULT 'BOOKED'`);
        await queryRunner.query(`DROP TYPE "public"."consignments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."consignments_status_enum_old" RENAME TO "consignments_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum_old" AS ENUM('UNPAID', 'PAID', 'REFUNDED')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "public"."orders_paymentstatus_enum_old" USING "paymentStatus"::"text"::"public"."orders_paymentstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID'`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_paymentstatus_enum_old" RENAME TO "orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "consignments" DROP COLUMN "lastSyncAt"`);
        await queryRunner.query(`DROP TABLE "consignment_events"`);
    }

}
