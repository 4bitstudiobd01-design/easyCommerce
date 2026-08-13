import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links historical orders to customer records.
 *
 * Orders were never given a customerId — create-order only stored the denormalised
 * customerName/customerPhone — so every customer read-model matched orders on
 * `customerId = ... OR customerPhone = ...`. That silently detached a customer's whole
 * order history the moment their phone number was edited.
 *
 * The write path now sets customerId. This backfills what already exists, matching on
 * (tenantId, phone) — the same pair the new unique index enforces, so a phone resolves
 * to at most one customer per tenant and the join cannot fan out.
 *
 * Only rows where customerId IS NULL are touched, so this is safe to re-run, and orders
 * whose phone has no matching customer are simply left alone.
 */
export class BackfillOrderCustomerId1786660000000 implements MigrationInterface {
  name = 'BackfillOrderCustomerId1786660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(`
      UPDATE orders o
      SET "customerId" = c.id
      FROM customers c
      WHERE o."customerId" IS NULL
        AND o."tenantId" = c."tenantId"
        AND o."customerPhone" IS NOT NULL
        AND TRIM(o."customerPhone") = TRIM(c.phone)
    `);

    const [{ remaining }] = await queryRunner.query(`
      SELECT COUNT(*)::int AS remaining
      FROM orders
      WHERE "customerId" IS NULL
    `);

    console.log(
      `[BackfillOrderCustomerId] linked orders to customers; ${remaining} order(s) still unlinked (no customer with a matching phone).`,
    );

    // Supports the customer order-history and stats queries now that customerId is populated.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_customerId"
      ON "orders" ("tenantId", "customerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_orders_tenantId_customerId"`);
    // The backfill itself is not reverted: customerId is now the correct linkage and
    // clearing it would reintroduce the detachment bug this migration exists to fix.
  }
}
