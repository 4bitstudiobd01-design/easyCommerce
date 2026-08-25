import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFraudCheckFieldsToCustomers1787685483245 implements MigrationInterface {
    name = 'AddFraudCheckFieldsToCustomers1787685483245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudTotalOrders" integer`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudSuccessOrders" integer`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudCancelOrders" integer`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudSuccessRate" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudCancelRate" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudSummaries" jsonb`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "fraudCheckedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudCheckedAt"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudSummaries"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudCancelRate"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudSuccessRate"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudCancelOrders"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudSuccessOrders"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "fraudTotalOrders"`);
    }

}
