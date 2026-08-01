import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsignmentsTable1785607006044 implements MigrationInterface {
    name = 'AddConsignmentsTable1785607006044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."consignments_courierprovider_enum" AS ENUM('STEADFAST', 'PATHAO', 'PAPERFLY')`);
        await queryRunner.query(`CREATE TYPE "public"."consignments_status_enum" AS ENUM('BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "consignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "trackingCode" character varying(100) NOT NULL, "orderId" uuid NOT NULL, "orderNumber" character varying(50) NOT NULL, "courierProvider" "public"."consignments_courierprovider_enum" NOT NULL DEFAULT 'STEADFAST', "recipientName" character varying(255) NOT NULL, "recipientPhone" character varying(50) NOT NULL, "recipientAddress" text NOT NULL, "city" character varying(100) NOT NULL DEFAULT 'Dhaka', "codAmount" numeric(12,2) NOT NULL, "deliveryCharge" numeric(12,2) NOT NULL DEFAULT '60', "status" "public"."consignments_status_enum" NOT NULL DEFAULT 'BOOKED', "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4d05e1d9fd87d0a796740dee630" UNIQUE ("trackingCode"), CONSTRAINT "PK_ac4a3e322938f3ea03ee389f7c3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "consignments"`);
        await queryRunner.query(`DROP TYPE "public"."consignments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."consignments_courierprovider_enum"`);
    }

}
