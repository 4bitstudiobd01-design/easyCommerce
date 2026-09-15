import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmTaxSlabs1788200000000 implements MigrationInterface {
    name = 'CreateHrmTaxSlabs1788200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "hr_tax_slabs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "fiscalYear" character varying(20) NOT NULL, "minAmount" numeric(14,2) NOT NULL, "maxAmount" numeric(14,2), "ratePercent" numeric(5,2) NOT NULL, "sortOrder" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_tax_slabs" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_tax_slabs_storeId_fiscalYear" ON "hr_tax_slabs" ("storeId", "fiscalYear")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_tax_slabs_storeId_fiscalYear"`);
        await queryRunner.query(`DROP TABLE "hr_tax_slabs"`);
    }

}
