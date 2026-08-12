import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingPlansAndSubscriptions1786200000000 implements MigrationInterface {
  name = 'AddBillingPlansAndSubscriptions1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "plans_code_enum" AS ENUM('FREE', 'GROWTH', 'ENTERPRISE')`);
    await queryRunner.query(
      `CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" "plans_code_enum" NOT NULL,
        "name" character varying(100) NOT NULL,
        "monthlyPriceBdt" numeric(12,2) NOT NULL DEFAULT 0,
        "maxStores" integer,
        "maxStaffPerStore" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plans_code" UNIQUE ("code"),
        CONSTRAINT "PK_plans_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TYPE "subscriptions_status_enum" AS ENUM('ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "status" "subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "gracePeriodEndsAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscriptions_tenantId" UNIQUE ("tenantId"),
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_planId" ON "subscriptions" ("planId")`);

    await queryRunner.query(
      `CREATE TYPE "subscription_invoices_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "subscriptionId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "amountBdt" numeric(12,2) NOT NULL,
        "tranId" character varying(100),
        "valId" character varying(100),
        "status" "subscription_invoices_status_enum" NOT NULL DEFAULT 'PENDING',
        "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "periodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_invoices_tranId" UNIQUE ("tranId"),
        CONSTRAINT "PK_subscription_invoices_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_subscription_invoices_tenantId" ON "subscription_invoices" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscription_invoices_subscriptionId" ON "subscription_invoices" ("subscriptionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_subscription_invoices_subscriptionId"`);
    await queryRunner.query(`DROP INDEX "IDX_subscription_invoices_tenantId"`);
    await queryRunner.query(`DROP TABLE "subscription_invoices"`);
    await queryRunner.query(`DROP TYPE "subscription_invoices_status_enum"`);

    await queryRunner.query(`DROP INDEX "IDX_subscriptions_planId"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "subscriptions_status_enum"`);

    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "plans_code_enum"`);
  }
}
