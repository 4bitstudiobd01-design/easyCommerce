import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderDomainIndexesAndOrderNoteTenantId1786580000000 implements MigrationInterface {
    name = 'AddOrderDomainIndexesAndOrderNoteTenantId1786580000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // order_notes was missing tenantId entirely, unlike every sibling entity in this domain.
        // Backfill from the parent order before enforcing NOT NULL.
        await queryRunner.query(`ALTER TABLE "order_notes" ADD "tenantId" uuid`);
        await queryRunner.query(`UPDATE "order_notes" SET "tenantId" = "orders"."tenantId" FROM "orders" WHERE "orders"."id" = "order_notes"."orderId"`);
        await queryRunner.query(`ALTER TABLE "order_notes" ALTER COLUMN "tenantId" SET NOT NULL`);

        // Foreign-key columns used on every order-detail page load, none of which had an index.
        await queryRunner.query(`CREATE INDEX "IDX_order_status_history_orderId" ON "order_status_history" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_order_notes_orderId" ON "order_notes" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_order_notes_tenantId" ON "order_notes" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_returns_orderId" ON "returns" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_returns_tenantId" ON "returns" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_return_items_returnId" ON "return_items" ("returnId")`);
        await queryRunner.query(`CREATE INDEX "IDX_refunds_orderId" ON "refunds" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_refunds_tenantId" ON "refunds" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_consignment_events_consignmentId" ON "consignment_events" ("consignmentId")`);

        // IDX_orders_tenantId_createdAt was created as (createdAt, tenantId), which is the wrong
        // leading column for the mandatory tenant-scoped access pattern used by every order query.
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_orders_tenantId_createdAt"`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_tenantId_createdAt" ON "orders" ("tenantId", "createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_tenantId_createdAt"`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_tenantId_createdAt" ON "orders" ("createdAt", "tenantId")`);

        await queryRunner.query(`DROP INDEX "public"."IDX_consignment_events_consignmentId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_refunds_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_refunds_orderId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_return_items_returnId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_returns_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_returns_orderId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_notes_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_notes_orderId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_status_history_orderId"`);

        await queryRunner.query(`ALTER TABLE "order_notes" DROP COLUMN "tenantId"`);
    }

}
