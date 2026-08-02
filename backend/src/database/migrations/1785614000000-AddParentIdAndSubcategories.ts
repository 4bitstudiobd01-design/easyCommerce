import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentIdAndSubcategories1785614000000 implements MigrationInterface {
  name = 'AddParentIdAndSubcategories1785614000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parentId" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image" text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parentId" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_parentId"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "isFeatured"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "image"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "icon"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "parentId"`);
  }
}
