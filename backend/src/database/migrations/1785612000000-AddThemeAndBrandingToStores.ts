import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeAndBrandingToStores1785612000000 implements MigrationInterface {
  name = 'AddThemeAndBrandingToStores1785612000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN "favicon" character varying(255),
        ADD COLUMN "metaTitle" character varying(255),
        ADD COLUMN "metaDescription" text,
        ADD COLUMN "primaryColor" character varying(50) NOT NULL DEFAULT '#2563eb',
        ADD COLUMN "fontFamily" character varying(50) NOT NULL DEFAULT 'Inter',
        ADD COLUMN "heroBanners" jsonb DEFAULT '[]'::jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores"
        DROP COLUMN "heroBanners",
        DROP COLUMN "fontFamily",
        DROP COLUMN "primaryColor",
        DROP COLUMN "metaDescription",
        DROP COLUMN "metaTitle",
        DROP COLUMN "favicon";
    `);
  }
}
