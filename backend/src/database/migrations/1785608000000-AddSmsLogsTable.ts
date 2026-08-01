import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSmsLogsTable1785608000000 implements MigrationInterface {
  name = 'AddSmsLogsTable1785608000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."sms_logs_status_enum" AS ENUM('SENT', 'FAILED', 'SANDBOX');
    `);

    await queryRunner.query(`
      CREATE TABLE "sms_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipientPhone" character varying(50) NOT NULL,
        "message" text NOT NULL,
        "gateway" character varying(50) NOT NULL DEFAULT 'BULKSMSBD',
        "status" "public"."sms_logs_status_enum" NOT NULL DEFAULT 'SANDBOX',
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sms_logs_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sms_logs"`);
    await queryRunner.query(`DROP TYPE "public"."sms_logs_status_enum"`);
  }
}
