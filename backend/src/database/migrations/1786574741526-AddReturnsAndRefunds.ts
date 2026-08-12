import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReturnsAndRefunds1786574741526 implements MigrationInterface {
    name = 'AddReturnsAndRefunds1786574741526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."refunds_status_enum" AS ENUM('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refundNumber" character varying(50) NOT NULL, "orderId" uuid NOT NULL, "paymentId" uuid NOT NULL, "returnId" uuid, "amount" numeric(12,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'BDT', "method" character varying(100) NOT NULL, "status" "public"."refunds_status_enum" NOT NULL DEFAULT 'REQUESTED', "gatewayRefundId" character varying(100), "reason" text, "failureReason" text, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_524c82c2d96896d64c38a00554e" UNIQUE ("refundNumber"), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."return_items_condition_enum" AS ENUM('GOOD', 'DAMAGED', 'USED', 'DEFECTIVE', 'WRONG_ITEM')`);
        await queryRunner.query(`CREATE TABLE "return_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "returnId" uuid NOT NULL, "orderItemId" uuid NOT NULL, "quantity" integer NOT NULL, "reason" text, "condition" "public"."return_items_condition_enum", "restockDecision" boolean, "inspectionNote" text, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6e6c1db00d31ab59c1bc22f6cb9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."returns_status_enum" AS ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_PENDING', 'IN_TRANSIT', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "returns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "returnNumber" character varying(50) NOT NULL, "orderId" uuid NOT NULL, "status" "public"."returns_status_enum" NOT NULL DEFAULT 'REQUESTED', "reason" text, "note" text, "rejectionReason" text, "tenantId" uuid NOT NULL, "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "approvedAt" TIMESTAMP WITH TIME ZONE, "receivedAt" TIMESTAMP WITH TIME ZONE, "inspectedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_424cbc15e555622e94842e9a303" UNIQUE ("returnNumber"), CONSTRAINT "PK_27a2f1895a71519ebfec7850361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_a276dea330e561499e4a6e1b309" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_2d7a02e4a660050ca70edd7df66" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "return_items" ADD CONSTRAINT "FK_cffa12df74a94bc3ccc347379e9" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "returns" ADD CONSTRAINT "FK_b3851bc6d0e2a7ddc7412806a0f" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "returns" DROP CONSTRAINT "FK_b3851bc6d0e2a7ddc7412806a0f"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_cffa12df74a94bc3ccc347379e9"`);
        await queryRunner.query(`ALTER TABLE "return_items" DROP CONSTRAINT "FK_2d7a02e4a660050ca70edd7df66"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_a276dea330e561499e4a6e1b309"`);
        await queryRunner.query(`DROP TABLE "returns"`);
        await queryRunner.query(`DROP TYPE "public"."returns_status_enum"`);
        await queryRunner.query(`DROP TABLE "return_items"`);
        await queryRunner.query(`DROP TYPE "public"."return_items_condition_enum"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
        await queryRunner.query(`DROP TYPE "public"."refunds_status_enum"`);
    }

}
