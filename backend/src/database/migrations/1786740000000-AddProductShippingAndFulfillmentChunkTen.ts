import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductShippingAndFulfillmentChunkTen1786740000000 implements MigrationInterface {
  name = 'AddProductShippingAndFulfillmentChunkTen1786740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipping_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "isDefault" boolean NOT NULL DEFAULT false,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipping_profiles" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shipping_profiles_tenant" ON "shipping_profiles" ("tenantId");
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "shippingRequired" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "weight" numeric(10,3),
      ADD COLUMN IF NOT EXISTS "weightUnit" character varying(10) NOT NULL DEFAULT 'KG',
      ADD COLUMN IF NOT EXISTS "length" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "width" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "height" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "dimensionUnit" character varying(10) NOT NULL DEFAULT 'CM',
      ADD COLUMN IF NOT EXISTS "shippingProfileId" uuid,
      ADD COLUMN IF NOT EXISTS "isFragile" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "digitalDeliveryType" character varying(50),
      ADD COLUMN IF NOT EXISTS "digitalAssetUrl" character varying(500),
      ADD COLUMN IF NOT EXISTS "downloadLimit" integer,
      ADD COLUMN IF NOT EXISTS "downloadExpiryDays" integer,
      ADD COLUMN IF NOT EXISTS "serviceDeliveryType" character varying(50),
      ADD COLUMN IF NOT EXISTS "serviceDuration" numeric(8,2),
      ADD COLUMN IF NOT EXISTS "serviceDurationUnit" character varying(20);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "serviceDurationUnit",
      DROP COLUMN IF EXISTS "serviceDuration",
      DROP COLUMN IF EXISTS "serviceDeliveryType",
      DROP COLUMN IF EXISTS "downloadExpiryDays",
      DROP COLUMN IF EXISTS "downloadLimit",
      DROP COLUMN IF EXISTS "digitalAssetUrl",
      DROP COLUMN IF EXISTS "digitalDeliveryType",
      DROP COLUMN IF EXISTS "isFragile",
      DROP COLUMN IF EXISTS "shippingProfileId",
      DROP COLUMN IF EXISTS "dimensionUnit",
      DROP COLUMN IF EXISTS "height",
      DROP COLUMN IF EXISTS "width",
      DROP COLUMN IF EXISTS "length",
      DROP COLUMN IF EXISTS "weightUnit",
      DROP COLUMN IF EXISTS "weight",
      DROP COLUMN IF EXISTS "shippingRequired";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "shipping_profiles";
    `);
  }
}
