import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageSortOrderChunkFour1786680000000 implements MigrationInterface {
  name = 'AddProductImageSortOrderChunkFour1786680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_images_product_tenant" ON "product_images" ("productId", "tenantId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_images_product_tenant"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN IF EXISTS "sortOrder"`);
  }
}
