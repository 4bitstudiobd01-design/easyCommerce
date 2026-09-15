import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingHomepageSectionTogglesToStores1788542572800 implements MigrationInterface {
  name = 'AddRemainingHomepageSectionTogglesToStores1788542572800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "showNewArrivals" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "showBestSellers" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "showFullCatalog" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "showPromoBanner" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "showWhyChooseUs" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "showWhyChooseUs"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "showPromoBanner"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "showFullCatalog"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "showBestSellers"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "showNewArrivals"`);
  }
}
