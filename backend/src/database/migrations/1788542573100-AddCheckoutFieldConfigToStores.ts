import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_CONFIG = {
  email: { show: true, required: false },
  address: { show: true, required: true },
  country: { show: true, required: true },
  division: { show: true, required: true },
  district: { show: true, required: true },
  cityArea: { show: true, required: true },
  zipCode: { show: true, required: false },
  orderNote: { show: true, required: false },
};

export class AddCheckoutFieldConfigToStores1788542573100 implements MigrationInterface {
  name = 'AddCheckoutFieldConfigToStores1788542573100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "checkoutFieldConfig" jsonb NOT NULL DEFAULT '${JSON.stringify(
        DEFAULT_CONFIG,
      )}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "checkoutFieldConfig"`);
  }
}
