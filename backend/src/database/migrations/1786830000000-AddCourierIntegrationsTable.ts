import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Courier integrations — the merchant's per-provider connection records that
 * back the Courier → Couriers tab.
 *
 * The legacy `stores.steadfastApiKey` / `pathaoClientId` columns are left in
 * place on purpose: existing merchants keep booking through them until they
 * save a provider from the new UI, at which point the row here takes over.
 * Nothing is copied automatically, so a rollback cannot lose credentials.
 */
export class AddCourierIntegrationsTable1786830000000 implements MigrationInterface {
  name = 'AddCourierIntegrationsTable1786830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('courier_integrations');
    if (hasTable) return;

    // Reuse the provider enum the consignments table already defines when it
    // exists, so both tables can never drift apart on supported providers.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courier_integrations_provider_enum') THEN
          CREATE TYPE "courier_integrations_provider_enum" AS ENUM
            ('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "courier_integrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "provider" "courier_integrations_provider_enum" NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "encryptedCredentials" text,
        "sandbox" boolean NOT NULL DEFAULT false,
        "autoCreateShipment" boolean NOT NULL DEFAULT false,
        "autoUpdateTracking" boolean NOT NULL DEFAULT true,
        "lastApiSyncAt" TIMESTAMP WITH TIME ZONE,
        "lastWebhookAt" TIMESTAMP WITH TIME ZONE,
        "apiCallsTotal" integer NOT NULL DEFAULT 0,
        "apiCallsFailed" integer NOT NULL DEFAULT 0,
        "lastTestedAt" TIMESTAMP WITH TIME ZONE,
        "lastTestSucceeded" boolean,
        "lastTestMessage" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courier_integrations" PRIMARY KEY ("id")
      )
    `);

    // One connection per provider per merchant — the upsert relies on this.
    await queryRunner.query(`
      ALTER TABLE "courier_integrations"
      ADD CONSTRAINT "UQ_courier_integrations_tenant_provider"
      UNIQUE ("tenantId", "provider")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courier_integrations_tenant"
      ON "courier_integrations" ("tenantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_courier_integrations_tenant"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courier_integrations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courier_integrations_provider_enum"`);
  }
}
