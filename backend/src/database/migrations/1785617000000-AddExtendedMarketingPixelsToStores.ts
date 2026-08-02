import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtendedMarketingPixelsToStores1785617000000 implements MigrationInterface {
  name = 'AddExtendedMarketingPixelsToStores1785617000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "googleAnalyticsId" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "snapchatPixelId" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "pinterestTagId" varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "pinterestTagId"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "snapchatPixelId"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "googleAnalyticsId"`);
  }
}
