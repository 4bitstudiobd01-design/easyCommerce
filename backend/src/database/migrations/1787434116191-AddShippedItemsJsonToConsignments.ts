import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShippedItemsJsonToConsignments1787434116191 implements MigrationInterface {
    name = 'AddShippedItemsJsonToConsignments1787434116191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consignments" ADD "shippedItemsJson" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consignments" DROP COLUMN "shippedItemsJson"`);
    }

}
