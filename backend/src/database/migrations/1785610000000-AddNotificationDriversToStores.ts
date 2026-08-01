import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDriversToStores1785610000000 implements MigrationInterface {
  name = 'AddNotificationDriversToStores1785610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."stores_smsdriver_enum" AS ENUM('BULKSMSBD', 'GREENWEB', 'TWILIO', 'DISABLED');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."stores_emaildriver_enum" AS ENUM('SMTP', 'SENDGRID', 'DISABLED');
    `);

    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN "smsDriver" "public"."stores_smsdriver_enum" NOT NULL DEFAULT 'BULKSMSBD',
        ADD COLUMN "smsApiKey" character varying(255),
        ADD COLUMN "smsSenderId" character varying(100),
        ADD COLUMN "emailDriver" "public"."stores_emaildriver_enum" NOT NULL DEFAULT 'SMTP',
        ADD COLUMN "smtpHost" character varying(255),
        ADD COLUMN "smtpPort" integer DEFAULT 587,
        ADD COLUMN "smtpUser" character varying(255),
        ADD COLUMN "smtpPass" character varying(255),
        ADD COLUMN "fromEmail" character varying(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores"
        DROP COLUMN "fromEmail",
        DROP COLUMN "smtpPass",
        DROP COLUMN "smtpUser",
        DROP COLUMN "smtpPort",
        DROP COLUMN "smtpHost",
        DROP COLUMN "emailDriver",
        DROP COLUMN "smsSenderId",
        DROP COLUMN "smsApiKey",
        DROP COLUMN "smsDriver";
    `);
    await queryRunner.query(`DROP TYPE "public"."stores_emaildriver_enum"`);
    await queryRunner.query(`DROP TYPE "public"."stores_smsdriver_enum"`);
  }
}
