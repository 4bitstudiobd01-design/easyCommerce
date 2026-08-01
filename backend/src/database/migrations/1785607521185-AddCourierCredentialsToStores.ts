import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCourierCredentialsToStores1785607521185 implements MigrationInterface {
    name = 'AddCourierCredentialsToStores1785607521185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "steadfastApiKey" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "steadfastSecretKey" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "pathaoClientId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "pathaoClientSecret" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "pathaoClientSecret"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "pathaoClientId"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "steadfastSecretKey"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "steadfastApiKey"`);
    }

}
