import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Anonymous storefront visit sessions, fed by a public beacon endpoint
 * (POST /tracking/visit) fired once per browser session on storefront pages.
 * Joined against orders.sessionId (see AddChannelAttributionToOrders) to
 * compute exact per-channel conversion rate for Top Traffic Sources.
 */
export class CreateStorefrontSessionsTable1786860000000 implements MigrationInterface {
  name = 'CreateStorefrontSessionsTable1786860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('storefront_sessions');
    if (!hasTable) {
      await queryRunner.query(`
        CREATE TABLE "storefront_sessions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "sessionId" uuid NOT NULL,
          "tenantId" uuid NOT NULL,
          "storeSlug" character varying(100) NOT NULL,
          "channel" character varying(50) NOT NULL DEFAULT 'direct',
          "utmSource" character varying(255),
          "utmMedium" character varying(255),
          "utmCampaign" character varying(255),
          "referrerHost" character varying(255),
          "landingPage" character varying(500),
          "pageViewCount" integer NOT NULL DEFAULT 1,
          "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_storefront_sessions" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_storefront_sessions_session_id" UNIQUE ("sessionId")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_storefront_sessions_tenant_channel" ON "storefront_sessions" ("tenantId", "channel")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_storefront_sessions_tenant_first_seen" ON "storefront_sessions" ("tenantId", "firstSeenAt")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "storefront_sessions"`);
  }
}
