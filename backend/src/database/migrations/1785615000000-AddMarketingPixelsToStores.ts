import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingPixelsToStores1785615000000 implements MigrationInterface {
  name = 'AddMarketingPixelsToStores1785615000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "facebookPixelId" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "facebookCapiToken" text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "facebookTestEventCode" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "tiktokPixelId" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "googleTagManagerId" varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "googleTagManagerId"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "tiktokPixelId"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "facebookTestEventCode"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "facebookCapiToken"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "facebookPixelId"`);
  }
}
