import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryChargesByZoneToStores1788542573000 implements MigrationInterface {
  name = 'AddDeliveryChargesByZoneToStores1788542573000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "deliveryChargeInsideDhaka" numeric(10,2) NOT NULL DEFAULT 60`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "deliveryChargeOutsideDhaka" numeric(10,2) NOT NULL DEFAULT 120`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "deliveryChargeOutsideDhaka"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "deliveryChargeInsideDhaka"`);
  }
}
