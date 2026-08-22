import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderNumberSequence1787429912436 implements MigrationInterface {
    name = 'AddOrderNumberSequence1787429912436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_number_sequences" ("tenantId" uuid NOT NULL, "lastValue" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_da2539cc3cb1826359ba2cb0781" PRIMARY KEY ("tenantId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "order_number_sequences"`);
    }

}
