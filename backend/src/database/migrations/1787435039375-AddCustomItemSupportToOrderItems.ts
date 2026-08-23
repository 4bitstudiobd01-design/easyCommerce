import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomItemSupportToOrderItems1787435039375 implements MigrationInterface {
    name = 'AddCustomItemSupportToOrderItems1787435039375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ADD "productImageUrl" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "isCustomItem" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "discountAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "productId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "productId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "discountAmount"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "isCustomItem"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "productImageUrl"`);
    }

}
