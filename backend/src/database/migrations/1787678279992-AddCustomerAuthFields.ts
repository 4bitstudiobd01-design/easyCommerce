import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerAuthFields1787678279992 implements MigrationInterface {
    name = 'AddCustomerAuthFields1787678279992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "passwordHash" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "hasAccount" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "registrationChannel" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "registrationUtmSource" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "registrationUtmMedium" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "registrationUtmCampaign" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "registrationReferrerHost" character varying(255)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_customers_tenant_email_registered" ON "customers" ("tenantId", "email") WHERE "passwordHash" IS NOT NULL`);

        await queryRunner.query(`CREATE TABLE "customer_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "ipAddress" character varying(100), "userAgent" character varying(255), "isValid" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_customer_sessions_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "customer_sessions" ADD CONSTRAINT "FK_customer_sessions_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_sessions" DROP CONSTRAINT "FK_customer_sessions_customerId"`);
        await queryRunner.query(`DROP TABLE "customer_sessions"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenant_email_registered"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "registrationReferrerHost"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "registrationUtmCampaign"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "registrationUtmMedium"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "registrationUtmSource"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "registrationChannel"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "hasAccount"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "passwordHash"`);
    }

}
