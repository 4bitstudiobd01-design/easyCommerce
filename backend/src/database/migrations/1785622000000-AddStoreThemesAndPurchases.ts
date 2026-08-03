import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreThemesAndPurchases1785622000000 implements MigrationInterface {
  name = 'AddStoreThemesAndPurchases1785622000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add activeThemeId and unlockedThemeIds to stores table
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "activeThemeId" character varying(100) NOT NULL DEFAULT 'DEFAULT_MODERN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "unlockedThemeIds" jsonb NOT NULL DEFAULT '["DEFAULT_MODERN"]'`,
    );

    // 2. Create theme_purchases table
    await queryRunner.query(
      `CREATE TABLE "theme_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "themeId" character varying(100) NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'COMPLETED',
        "paymentMethod" character varying(50) NOT NULL DEFAULT 'BALANCE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_theme_purchases_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_theme_purchases_tenantId" ON "theme_purchases" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_theme_purchases_storeId" ON "theme_purchases" ("storeId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_theme_purchases_storeId"`);
    await queryRunner.query(`DROP INDEX "IDX_theme_purchases_tenantId"`);
    await queryRunner.query(`DROP TABLE "theme_purchases"`);

    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "unlockedThemeIds"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "activeThemeId"`);
  }
}
