import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryDomainFoundationChunkOne1786780000000 implements MigrationInterface {
  name = 'AddCategoryDomainFoundationChunkOne1786780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create CategoryStatus enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "categories_status_enum" AS ENUM('ACTIVE', 'DRAFT', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Add status column with default ACTIVE
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "status" "categories_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );

    // 3. Add sortOrder column with default 0
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0`,
    );

    // 4. Drop old non-unique indexes if present
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenantId_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenant_slug"`);

    // 5. Create composite unique index on (tenantId, slug)
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_tenant_slug" ON "categories" ("tenantId", "slug")`,
    );

    // 6. Create performance composite indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_tenant_status" ON "categories" ("tenantId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_tenant_sortOrder" ON "categories" ("tenantId", "sortOrder")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenant_sortOrder"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_tenant_slug"`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_tenantId_slug" ON "categories" ("tenantId", "slug")`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "sortOrder"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "categories_status_enum"`);
  }
}
