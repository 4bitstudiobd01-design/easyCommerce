import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marketing blog posts. Platform-owned content written by the BitCommerce
 * team, so there is deliberately no tenantId — these are not merchant records.
 */
export class AddBlogPostsTable1786890000000 implements MigrationInterface {
  name = 'AddBlogPostsTable1786890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."blog_posts_status_enum" AS ENUM('DRAFT', 'PUBLISHED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "excerpt" character varying(500) NOT NULL DEFAULT '',
        "content" text NOT NULL,
        "authorName" character varying(120) NOT NULL DEFAULT 'BitCommerce Team',
        "category" character varying(100) NOT NULL DEFAULT 'Product',
        "coverImageUrl" character varying(500),
        "status" "public"."blog_posts_status_enum" NOT NULL DEFAULT 'DRAFT',
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "readingMinutes" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_posts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_posts_slug" ON "blog_posts" ("slug")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_blog_posts_status_published" ON "blog_posts" ("status", "publishedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_posts_status_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_posts_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."blog_posts_status_enum"`);
  }
}
