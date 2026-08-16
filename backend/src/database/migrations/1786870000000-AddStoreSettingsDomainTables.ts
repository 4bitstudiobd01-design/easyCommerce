import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backs the Store Settings hub: localization/preferences/order/checkout/customer
 * and homepage toggles as store columns, plus three new tables for the
 * collection-shaped settings (delivery zones, API keys, webhooks).
 */
export class AddStoreSettingsDomainTables1786870000000 implements MigrationInterface {
  name = 'AddStoreSettingsDomainTables1786870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN IF NOT EXISTS "language" character varying(10) NOT NULL DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS "timezone" character varying(64) NOT NULL DEFAULT 'Asia/Dhaka',
        ADD COLUMN IF NOT EXISTS "dateFormat" character varying(32) NOT NULL DEFAULT 'DD/MM/YYYY',
        ADD COLUMN IF NOT EXISTS "weightUnit" character varying(10) NOT NULL DEFAULT 'KG',
        ADD COLUMN IF NOT EXISTS "maintenanceMode" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "maintenanceMessage" text,
        ADD COLUMN IF NOT EXISTS "catalogModeEnabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "showOutOfStockProducts" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "orderNumberPrefix" character varying(20) NOT NULL DEFAULT 'ORD-',
        ADD COLUMN IF NOT EXISTS "autoConfirmOrders" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "invoiceFooterNote" text,
        ADD COLUMN IF NOT EXISTS "guestCheckoutEnabled" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "requireCustomerEmail" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "showCouponFieldAtCheckout" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "showOrderNoteFieldAtCheckout" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "minimumOrderAmount" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "allowCustomerRegistration" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "requireEmailVerification" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "allowCustomerReviews" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "autoApproveReviews" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "navigationLinks" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "showHeroSection" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "showFeaturedProducts" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "showCategoriesSection" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "featuredProductsCount" integer NOT NULL DEFAULT 8;
    `);

    const hasZones = await queryRunner.hasTable('delivery_zones');
    if (!hasZones) {
      await queryRunner.query(`
        CREATE TABLE "delivery_zones" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "name" character varying(120) NOT NULL,
          "areas" jsonb NOT NULL DEFAULT '[]'::jsonb,
          "deliveryCharge" numeric(12,2) NOT NULL DEFAULT 60,
          "estimatedDeliveryTime" character varying(60),
          "isActive" boolean NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_delivery_zones" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_delivery_zones_tenant_store" ON "delivery_zones" ("tenantId", "storeId")
      `);
    }

    const hasApiKeys = await queryRunner.hasTable('store_api_keys');
    if (!hasApiKeys) {
      await queryRunner.query(`
        CREATE TABLE "store_api_keys" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "name" character varying(120) NOT NULL,
          "keyPrefix" character varying(24) NOT NULL,
          "keyHash" character varying(128) NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "lastUsedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_store_api_keys" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_store_api_keys_hash" UNIQUE ("keyHash")
        )
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_store_api_keys_tenant_store" ON "store_api_keys" ("tenantId", "storeId")
      `);
    }

    const hasWebhooks = await queryRunner.hasTable('store_webhooks');
    if (!hasWebhooks) {
      await queryRunner.query(`
        CREATE TABLE "store_webhooks" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "storeId" uuid NOT NULL,
          "targetUrl" character varying(500) NOT NULL,
          "events" jsonb NOT NULL DEFAULT '[]'::jsonb,
          "secret" character varying(128) NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "lastTriggeredAt" TIMESTAMPTZ,
          "failureCount" integer NOT NULL DEFAULT 0,
          "lastError" text,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_store_webhooks" PRIMARY KEY ("id")
        )
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_store_webhooks_tenant_store" ON "store_webhooks" ("tenantId", "storeId")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "store_webhooks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_api_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_zones"`);
    await queryRunner.query(`
      ALTER TABLE "stores"
        DROP COLUMN IF EXISTS "featuredProductsCount",
        DROP COLUMN IF EXISTS "showCategoriesSection",
        DROP COLUMN IF EXISTS "showFeaturedProducts",
        DROP COLUMN IF EXISTS "showHeroSection",
        DROP COLUMN IF EXISTS "navigationLinks",
        DROP COLUMN IF EXISTS "autoApproveReviews",
        DROP COLUMN IF EXISTS "allowCustomerReviews",
        DROP COLUMN IF EXISTS "requireEmailVerification",
        DROP COLUMN IF EXISTS "allowCustomerRegistration",
        DROP COLUMN IF EXISTS "minimumOrderAmount",
        DROP COLUMN IF EXISTS "showOrderNoteFieldAtCheckout",
        DROP COLUMN IF EXISTS "showCouponFieldAtCheckout",
        DROP COLUMN IF EXISTS "requireCustomerEmail",
        DROP COLUMN IF EXISTS "guestCheckoutEnabled",
        DROP COLUMN IF EXISTS "invoiceFooterNote",
        DROP COLUMN IF EXISTS "autoConfirmOrders",
        DROP COLUMN IF EXISTS "orderNumberPrefix",
        DROP COLUMN IF EXISTS "showOutOfStockProducts",
        DROP COLUMN IF EXISTS "catalogModeEnabled",
        DROP COLUMN IF EXISTS "maintenanceMessage",
        DROP COLUMN IF EXISTS "maintenanceMode",
        DROP COLUMN IF EXISTS "weightUnit",
        DROP COLUMN IF EXISTS "dateFormat",
        DROP COLUMN IF EXISTS "timezone",
        DROP COLUMN IF EXISTS "language";
    `);
  }
}
