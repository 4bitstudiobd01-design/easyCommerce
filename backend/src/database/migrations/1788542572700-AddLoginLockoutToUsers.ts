import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginLockoutToUsers1788542572700 implements MigrationInterface {
  name = 'AddLoginLockoutToUsers1788542572700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "loginLockedUntil" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "loginLockedUntil"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failedLoginAttempts"`);
  }
}
