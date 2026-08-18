import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreCountry1787073485570 implements MigrationInterface {
    name = 'AddStoreCountry1787073485570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "country" character varying(100) NOT NULL DEFAULT 'Bangladesh'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "country"`);
    }

}
