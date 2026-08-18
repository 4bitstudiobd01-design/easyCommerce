import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTermsAcceptedAt1787079448556 implements MigrationInterface {
    name = 'AddUserTermsAcceptedAt1787079448556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "termsAcceptedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAcceptedAt"`);
    }

}
