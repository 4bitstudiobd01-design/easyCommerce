import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderDomainChunkOne1786572014210 implements MigrationInterface {
    name = 'UpdateOrderDomainChunkOne1786572014210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_theme_purchases_tranId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_planId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscription_invoices_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_subscription_invoices_subscriptionId"`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_history_previousstatus_enum" AS ENUM('PENDING', 'ON_HOLD', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_history_newstatus_enum" AS ENUM('PENDING', 'ON_HOLD', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')`);
        await queryRunner.query(`CREATE TABLE "order_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "previousStatus" "public"."order_status_history_previousstatus_enum", "newStatus" "public"."order_status_history_newstatus_enum" NOT NULL, "changedBy" character varying(255) NOT NULL, "reason" text, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e6c66d853f155531985fc4f6ec8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "variantId" uuid`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "variantTitle" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerId" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "area" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "thana" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "district" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "division" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerNote" text`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "internalNote" text`);
        await queryRunner.query(`ALTER TABLE "theme_purchases" ADD CONSTRAINT "UQ_7d76573f75a55996815047a0315" UNIQUE ("tranId")`);
        await queryRunner.query(`ALTER TABLE "order_status_history" ADD CONSTRAINT "FK_689db3835e5550e68d26ca32676" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_689db3835e5550e68d26ca32676"`);
        await queryRunner.query(`ALTER TABLE "theme_purchases" DROP CONSTRAINT "UQ_7d76573f75a55996815047a0315"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "internalNote"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerNote"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "division"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "district"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "thana"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "area"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerId"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "variantTitle"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "variantId"`);
        await queryRunner.query(`DROP TABLE "order_status_history"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_history_newstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_history_previousstatus_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_subscription_invoices_subscriptionId" ON "subscription_invoices" ("subscriptionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_subscription_invoices_tenantId" ON "subscription_invoices" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_planId" ON "subscriptions" ("planId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_theme_purchases_tranId" ON "theme_purchases" ("tranId") WHERE ("tranId" IS NOT NULL)`);
    }

}
