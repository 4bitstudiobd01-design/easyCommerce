import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductVisibilityPlacementOrdering1787689681301 implements MigrationInterface {
    name = 'AddProductVisibilityPlacementOrdering1787689681301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "isVisible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."products_homepagesections_enum" AS ENUM('HERO_FEATURED', 'NEW_ARRIVALS', 'BEST_SELLERS')`);
        await queryRunner.query(`ALTER TABLE "products" ADD "homepageSections" "public"."products_homepagesections_enum" array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`CREATE INDEX "IDX_products_tenant_isVisible" ON "products" ("tenantId", "isVisible") `);
        await queryRunner.query(`CREATE INDEX "IDX_products_tenant_sortOrder" ON "products" ("tenantId", "sortOrder") `);

        // Backfill: without this, every NEW_ARRIVALS/BEST_SELLERS/HERO_FEATURED
        // homepage section would render empty immediately after this ships,
        // since no product is tagged yet. Auto-tag each tenant's 8 most
        // recently-created ACTIVE products as NEW_ARRIVALS so the homepage
        // isn't blank on day one; merchants can retag via the dashboard.
        await queryRunner.query(`
            UPDATE "products" p
            SET "homepageSections" = ARRAY['NEW_ARRIVALS']::products_homepagesections_enum[]
            WHERE p.id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt" DESC) AS rn
                    FROM "products"
                    WHERE status = 'ACTIVE'
                ) ranked
                WHERE rn <= 8
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_products_tenant_sortOrder"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_products_tenant_isVisible"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "homepageSections"`);
        await queryRunner.query(`DROP TYPE "public"."products_homepagesections_enum"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isVisible"`);
    }

}
