import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferenceToPushNotifications1788542573200 implements MigrationInterface {
  name = 'AddReferenceToPushNotifications1788542573200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "push_notifications" ADD COLUMN "referenceType" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_notifications" ADD COLUMN "referenceId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "push_notifications" DROP COLUMN "referenceId"`);
    await queryRunner.query(`ALTER TABLE "push_notifications" DROP COLUMN "referenceType"`);
  }
}
