import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetAndSessionFields1787425561643 implements MigrationInterface {
    name = 'AddPasswordResetAndSessionFields1787425561643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetOtpHash" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetOtpExpiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetAttempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetLastRequestedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "refreshToken" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "refreshToken" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetLastRequestedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetAttempts"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetOtpExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetOtpHash"`);
    }

}
