import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase A (Sales-by-Source report): merchant-entered advertising spend, the
 * denominator for ROAS / CPA. Manual entry only — no auto-import from ad platforms.
 *
 * Hand-written (not the raw `migration:generate` output) so it touches only the
 * new `marketing_ad_spends` table and does not carry the unrelated schema drift
 * the generator picked up between the entities and the current database.
 */
export class AddMarketingAdSpend1788897007433 implements MigrationInterface {
  name = 'AddMarketingAdSpend1788897007433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."marketing_ad_spends_dimension_enum" AS ENUM('CHANNEL', 'SOURCE', 'CAMPAIGN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "marketing_ad_spends" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "dimension" "public"."marketing_ad_spends_dimension_enum" NOT NULL,
        "dimensionValue" character varying(255) NOT NULL,
        "periodStart" date NOT NULL,
        "periodEnd" date NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'BDT',
        "note" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketing_ad_spends" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_ad_spends_tenant" ON "marketing_ad_spends" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_ad_spends_store" ON "marketing_ad_spends" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_ad_spends_tenant_store" ON "marketing_ad_spends" ("tenantId", "storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_marketing_ad_spends_lookup" ON "marketing_ad_spends" ("tenantId", "storeId", "dimension", "periodStart")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_ad_spends_lookup"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_ad_spends_tenant_store"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_ad_spends_store"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_marketing_ad_spends_tenant"`);
    await queryRunner.query(`DROP TABLE "marketing_ad_spends"`);
    await queryRunner.query(`DROP TYPE "public"."marketing_ad_spends_dimension_enum"`);
  }
}
