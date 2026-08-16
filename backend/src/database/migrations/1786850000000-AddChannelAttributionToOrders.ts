import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds marketing-channel attribution to orders so revenue can be broken down
 * by acquisition channel (Sales by Channel) and matched against storefront
 * visit sessions (Top Traffic Sources conversion rate).
 *
 * `channel` is a normalized bucket (not a free-text UTM value) so GROUP BY
 * queries stay stable regardless of how a merchant's campaigns are tagged.
 * The raw UTM/referrer fields are kept alongside it for drill-down/debugging.
 */
export class AddChannelAttributionToOrders1786850000000 implements MigrationInterface {
  name = 'AddChannelAttributionToOrders1786850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "channel" character varying(50) NOT NULL DEFAULT 'direct',
        ADD COLUMN IF NOT EXISTS "utmSource" character varying(255),
        ADD COLUMN IF NOT EXISTS "utmMedium" character varying(255),
        ADD COLUMN IF NOT EXISTS "utmCampaign" character varying(255),
        ADD COLUMN IF NOT EXISTS "referrerHost" character varying(255),
        ADD COLUMN IF NOT EXISTS "sessionId" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_tenant_channel" ON "orders" ("tenantId", "channel");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_session_id" ON "orders" ("sessionId") WHERE "sessionId" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_session_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_tenant_channel";`);
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "sessionId",
        DROP COLUMN IF EXISTS "referrerHost",
        DROP COLUMN IF EXISTS "utmCampaign",
        DROP COLUMN IF EXISTS "utmMedium",
        DROP COLUMN IF EXISTS "utmSource",
        DROP COLUMN IF EXISTS "channel";
    `);
  }
}
