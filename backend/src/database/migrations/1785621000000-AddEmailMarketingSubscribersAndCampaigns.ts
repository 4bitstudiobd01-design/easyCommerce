import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailMarketingSubscribersAndCampaigns1785621000000
  implements MigrationInterface
{
  name = 'AddEmailMarketingSubscribersAndCampaigns1785621000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create newsletter_subscribers table
    await queryRunner.query(
      `CREATE TABLE "newsletter_subscribers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "name" character varying(255),
        "isSubscribed" boolean NOT NULL DEFAULT true,
        "source" character varying(100) NOT NULL DEFAULT 'STOREFRONT_FOOTER',
        "subscribedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "unsubscribedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_newsletter_subscribers_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_subscribers_tenantId" ON "newsletter_subscribers" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_subscribers_storeId" ON "newsletter_subscribers" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_subscribers_email" ON "newsletter_subscribers" ("email")`,
    );

    // 2. Create email_campaigns table
    await queryRunner.query(
      `CREATE TABLE "email_campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "subject" character varying(255) NOT NULL,
        "contentHtml" text NOT NULL,
        "recipientType" character varying(100) NOT NULL DEFAULT 'ALL_SUBSCRIBERS',
        "totalSent" integer NOT NULL DEFAULT 0,
        "status" character varying(50) NOT NULL DEFAULT 'DRAFT',
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_campaigns_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_email_campaigns_tenantId" ON "email_campaigns" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_campaigns_storeId" ON "email_campaigns" ("storeId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_email_campaigns_storeId"`);
    await queryRunner.query(`DROP INDEX "IDX_email_campaigns_tenantId"`);
    await queryRunner.query(`DROP TABLE "email_campaigns"`);

    await queryRunner.query(`DROP INDEX "IDX_newsletter_subscribers_email"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_subscribers_storeId"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_subscribers_tenantId"`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers"`);
  }
}
