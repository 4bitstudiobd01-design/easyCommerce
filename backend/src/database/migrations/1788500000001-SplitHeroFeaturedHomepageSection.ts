import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits the single `HERO_FEATURED` homepage-section value into two: `HERO`
 * (used to fill the hero carousel when a store has no banner images) and
 * `FEATURED` (the "Featured Products" row). Existing `HERO_FEATURED` tags become
 * `FEATURED`, since that is what they rendered as before this change.
 *
 * PostgreSQL forbids subqueries inside an `ALTER COLUMN ... TYPE ... USING`
 * expression and cannot drop an enum value in place, so the migration stages the
 * data through a temporary text[] column while the enum type is rebuilt.
 */
export class SplitHeroFeaturedHomepageSection1788500000001 implements MigrationInterface {
  name = 'SplitHeroFeaturedHomepageSection1788500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Stash the current values as text, rewriting HERO_FEATURED -> FEATURED.
    await queryRunner.query(`ALTER TABLE "products" ADD "homepageSections_tmp" text[] NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`
      UPDATE "products"
      SET "homepageSections_tmp" = (
        SELECT COALESCE(array_agg(
          CASE WHEN elem::text = 'HERO_FEATURED' THEN 'FEATURED' ELSE elem::text END
        ), '{}')
        FROM unnest("homepageSections") AS elem
      )
    `);

    // 2. Rebuild the enum type with the new value set.
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "homepageSections"`);
    await queryRunner.query(`DROP TYPE "public"."products_homepagesections_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."products_homepagesections_enum" AS ENUM('HERO', 'FEATURED', 'NEW_ARRIVALS', 'BEST_SELLERS')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "homepageSections" "public"."products_homepagesections_enum" array NOT NULL DEFAULT '{}'`,
    );

    // 3. Restore the staged values into the new column, then drop the temp column.
    await queryRunner.query(`
      UPDATE "products"
      SET "homepageSections" = "homepageSections_tmp"::"public"."products_homepagesections_enum"[]
    `);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "homepageSections_tmp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "homepageSections_tmp" text[] NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`
      UPDATE "products"
      SET "homepageSections_tmp" = (
        SELECT COALESCE(array_agg(
          CASE WHEN elem::text IN ('HERO', 'FEATURED') THEN 'HERO_FEATURED' ELSE elem::text END
        ), '{}')
        FROM unnest("homepageSections") AS elem
      )
    `);

    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "homepageSections"`);
    await queryRunner.query(`DROP TYPE "public"."products_homepagesections_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."products_homepagesections_enum" AS ENUM('HERO_FEATURED', 'NEW_ARRIVALS', 'BEST_SELLERS')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "homepageSections" "public"."products_homepagesections_enum" array NOT NULL DEFAULT '{}'`,
    );

    // Deduplicate: two source values can now collapse to the same HERO_FEATURED.
    await queryRunner.query(`
      UPDATE "products"
      SET "homepageSections" = (
        SELECT COALESCE(array_agg(DISTINCT v), '{}')
        FROM unnest("homepageSections_tmp"::"public"."products_homepagesections_enum"[]) AS v
      )
    `);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "homepageSections_tmp"`);
  }
}
