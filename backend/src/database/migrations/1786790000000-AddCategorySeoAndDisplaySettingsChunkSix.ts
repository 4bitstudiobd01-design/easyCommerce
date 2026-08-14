import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategorySeoAndDisplaySettingsChunkSix1786790000000 implements MigrationInterface {
  name = 'AddCategorySeoAndDisplaySettingsChunkSix1786790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seoTitle" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "metaDescription" text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "showInStorefront" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "showInStorefront"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "isVisible"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "metaDescription"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "seoTitle"`);
  }
}
