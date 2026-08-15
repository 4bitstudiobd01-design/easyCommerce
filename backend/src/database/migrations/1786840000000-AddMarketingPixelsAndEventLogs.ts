import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingPixelsAndEventLogs1786840000000 implements MigrationInterface {
  name = 'AddMarketingPixelsAndEventLogs1786840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Marketing Pixels Table
    const hasPixelsTable = await queryRunner.hasTable('marketing_pixels');
    if (!hasPixelsTable) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketing_pixels_provider_enum') THEN
            CREATE TYPE "marketing_pixels_provider_enum" AS ENUM
              ('META', 'GOOGLE_ANALYTICS', 'GOOGLE_ADS', 'TIKTOK');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketing_pixels_status_enum') THEN
            CREATE TYPE "marketing_pixels_status_enum" AS ENUM
              ('CONNECTED', 'DISCONNECTED');
          END IF;
        END
        $$;
      `);

      await queryRunner.query(`
        CREATE TABLE "marketing_pixels" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "provider" "marketing_pixels_provider_enum" NOT NULL,
          "pixelId" character varying(255) NOT NULL,
          "accessToken" text,
          "status" "marketing_pixels_status_enum" NOT NULL DEFAULT 'CONNECTED',
          "lastEventAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_marketing_pixels" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_marketing_pixels_tenant_store_provider" UNIQUE ("tenantId", "storeId", "provider")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_marketing_pixels_tenant_store" ON "marketing_pixels" ("tenantId", "storeId")
      `);
    }

    // 2. Marketing Event Configs Table
    const hasEventConfigsTable = await queryRunner.hasTable('marketing_event_configs');
    if (!hasEventConfigsTable) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketing_event_configs_eventname_enum') THEN
            CREATE TYPE "marketing_event_configs_eventname_enum" AS ENUM
              ('PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase');
          END IF;
        END
        $$;
      `);

      await queryRunner.query(`
        CREATE TABLE "marketing_event_configs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "eventName" "marketing_event_configs_eventname_enum" NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_marketing_event_configs" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_marketing_event_configs_tenant_store_event" UNIQUE ("tenantId", "storeId", "eventName")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_marketing_event_configs_tenant_store" ON "marketing_event_configs" ("tenantId", "storeId")
      `);
    }

    // 3. Marketing Event Logs Table
    const hasEventLogsTable = await queryRunner.hasTable('marketing_event_logs');
    if (!hasEventLogsTable) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketing_event_logs_status_enum') THEN
            CREATE TYPE "marketing_event_logs_status_enum" AS ENUM
              ('SENT', 'FAILED');
          END IF;
        END
        $$;
      `);

      await queryRunner.query(`
        CREATE TABLE "marketing_event_logs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "eventName" character varying(100) NOT NULL,
          "source" character varying(100) NOT NULL,
          "orderRef" character varying(100),
          "status" "marketing_event_logs_status_enum" NOT NULL,
          "errorDetails" text,
          "payloadJson" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_marketing_event_logs" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_marketing_event_logs_tenant_store" ON "marketing_event_logs" ("tenantId", "storeId");
        CREATE INDEX "IDX_marketing_event_logs_tenant_store_created" ON "marketing_event_logs" ("tenantId", "storeId", "createdAt" DESC);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_event_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_event_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_pixels"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketing_event_logs_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketing_event_configs_eventname_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketing_pixels_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketing_pixels_provider_enum"`);
  }
}
