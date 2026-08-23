import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOrderNumberUniquenessPerTenant1787435803705 implements MigrationInterface {
    name = 'FixOrderNumberUniquenessPerTenant1787435803705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a927d20aab3b21a564b0d00fd6" ON "orders" ("tenantId", "orderNumber") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a927d20aab3b21a564b0d00fd6"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber")`);
    }

}
