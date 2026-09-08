import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 0 of the pixel rebuild — additive schema only (nothing is dropped or
 * renamed, so the legacy connect/disconnect services keep working until Phase 1
 * replaces them).
 *
 *  - marketing_pixels: + label, credentialsEncrypted, capiEnabled, pageScopeMode,
 *    isActive; + partial-unique (storeId, provider, label) and (tenantId, storeId,
 *    provider) indexes. The old (tenantId, storeId, provider) row-uniqueness was
 *    only enforced in application code, never in the DB, so nothing to relax here.
 *  - marketing_pixel_page_rules: new table, FK -> marketing_pixels ON DELETE CASCADE.
 *  - marketing_event_logs: + pixelId (FK -> marketing_pixels ON DELETE SET NULL),
 *    provider, transport, sessionId, orderId, utmSource/Medium/Campaign, httpStatus,
 *    errorMessage; + lookup indexes.
 *
 * Hand-written (not raw migration:generate output) so it touches only the marketing
 * tables and not the unrelated schema drift the generator picks up.
 */
export class MarketingPixelRedesign1788902057330 implements MigrationInterface {
  name = 'MarketingPixelRedesign1788902057330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- marketing_pixels: new columns ---
    await queryRunner.query(`ALTER TABLE "marketing_pixels" ADD "label" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" ADD "credentialsEncrypted" text`);
    await queryRunner.query(
      `ALTER TABLE "marketing_pixels" ADD "capiEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_pixels_pagescopemode_enum" AS ENUM('ALL', 'RULES')`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_pixels" ADD "pageScopeMode" "public"."marketing_pixels_pagescopemode_enum" NOT NULL DEFAULT 'ALL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_pixels" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_pixels_tenant_store_provider" ON "marketing_pixels" ("tenantId", "storeId", "provider")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_marketing_pixels_store_provider_label" ON "marketing_pixels" ("storeId", "provider", "label") WHERE "label" IS NOT NULL`,
    );

    // --- marketing_pixel_page_rules: new table ---
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_pixel_page_rules_matchtype_enum" AS ENUM('PAGE_TYPE', 'URL_PATTERN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_pixel_page_rules_pagetype_enum" AS ENUM('HOME', 'PRODUCT', 'COLLECTION', 'CATEGORY', 'CART', 'CHECKOUT', 'THANK_YOU', 'SEARCH', 'BLOG', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_pixel_page_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "pixelId" uuid NOT NULL,
        "matchType" "public"."marketing_pixel_page_rules_matchtype_enum" NOT NULL,
        "pageType" "public"."marketing_pixel_page_rules_pagetype_enum",
        "urlPattern" character varying(500),
        "include" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketing_pixel_page_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_marketing_pixel_page_rules_pixel"
          FOREIGN KEY ("pixelId") REFERENCES "marketing_pixels"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_pixel_page_rules_pixel" ON "marketing_pixel_page_rules" ("pixelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_pixel_page_rules_tenant_store" ON "marketing_pixel_page_rules" ("tenantId", "storeId")`,
    );

    // --- marketing_event_logs: new columns ---
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" ADD "pixelId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD CONSTRAINT "FK_marketing_event_logs_pixel"
        FOREIGN KEY ("pixelId") REFERENCES "marketing_pixels"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_event_logs_provider_enum" AS ENUM('META', 'GOOGLE_ANALYTICS', 'GOOGLE_ADS', 'TIKTOK')`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD "provider" "public"."marketing_event_logs_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_event_logs_transport_enum" AS ENUM('BROWSER', 'SERVER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD "transport" "public"."marketing_event_logs_transport_enum" NOT NULL DEFAULT 'BROWSER'`,
    );
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" ADD "sessionId" uuid`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" ADD "orderId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD "utmSource" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD "utmMedium" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" ADD "utmCampaign" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" ADD "httpStatus" integer`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" ADD "errorMessage" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_event_logs_pixel" ON "marketing_event_logs" ("pixelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_event_logs_tenant_store_order" ON "marketing_event_logs" ("tenantId", "storeId", "orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_event_logs_tenant_store_event" ON "marketing_event_logs" ("tenantId", "storeId", "eventName")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // marketing_event_logs
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_event_logs_tenant_store_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_event_logs_tenant_store_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_event_logs_pixel"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "errorMessage"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "httpStatus"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "utmCampaign"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "utmMedium"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "utmSource"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "orderId"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "sessionId"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "transport"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_event_logs_transport_enum"`);
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "provider"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_event_logs_provider_enum"`);
    await queryRunner.query(
      `ALTER TABLE "marketing_event_logs" DROP CONSTRAINT "FK_marketing_event_logs_pixel"`,
    );
    await queryRunner.query(`ALTER TABLE "marketing_event_logs" DROP COLUMN "pixelId"`);

    // marketing_pixel_page_rules
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_pixel_page_rules_tenant_store"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_pixel_page_rules_pixel"`);
    await queryRunner.query(`DROP TABLE "marketing_pixel_page_rules"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_pixel_page_rules_pagetype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_pixel_page_rules_matchtype_enum"`);

    // marketing_pixels
    await queryRunner.query(`DROP INDEX "public"."UQ_marketing_pixels_store_provider_label"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_pixels_tenant_store_provider"`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" DROP COLUMN "isActive"`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" DROP COLUMN "pageScopeMode"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_pixels_pagescopemode_enum"`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" DROP COLUMN "capiEnabled"`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" DROP COLUMN "credentialsEncrypted"`);
    await queryRunner.query(`ALTER TABLE "marketing_pixels" DROP COLUMN "label"`);
  }
}
