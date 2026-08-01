import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushNotificationsTable1785611000000 implements MigrationInterface {
  name = 'AddPushNotificationsTable1785611000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."push_notifications_type_enum" AS ENUM('ORDER_PLACED', 'ORDER_STATUS_CHANGED', 'STOCK_LOW', 'PAYMENT_RECEIVED');
    `);

    await queryRunner.query(`
      CREATE TABLE "push_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" "public"."push_notifications_type_enum" NOT NULL DEFAULT 'ORDER_PLACED',
        "isRead" boolean NOT NULL DEFAULT false,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_notifications_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "push_notifications"`);
    await queryRunner.query(`DROP TYPE "public"."push_notifications_type_enum"`);
  }
}
