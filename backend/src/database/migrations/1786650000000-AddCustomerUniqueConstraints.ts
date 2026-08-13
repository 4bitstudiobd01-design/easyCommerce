import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer uniqueness was enforced only in application code (create/update/import each
 * run a SELECT-then-INSERT), which races under concurrency and lets duplicate customers
 * through. These indexes make the database the authority.
 *
 * Phone is mandatory, so it gets a plain composite unique index. Email is nullable and
 * uniqueness is only checked when a value is supplied, so it gets a partial unique index
 * — without the WHERE clause, a second customer with no email would collide.
 */
export class AddCustomerUniqueConstraints1786650000000 implements MigrationInterface {
  name = 'AddCustomerUniqueConstraints1786650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Collapse any pre-existing duplicates first, keeping the earliest record, otherwise
    // the unique index cannot be built on existing data.
    await queryRunner.query(`
      DELETE FROM customers a
      USING customers b
      WHERE a."tenantId" = b."tenantId"
        AND a.phone = b.phone
        AND a."createdAt" > b."createdAt"
    `);

    await queryRunner.query(`
      DELETE FROM customers a
      USING customers b
      WHERE a."tenantId" = b."tenantId"
        AND a.email IS NOT NULL
        AND b.email IS NOT NULL
        AND LOWER(a.email) = LOWER(b.email)
        AND a."createdAt" > b."createdAt"
    `);

    // Redundant once the unique variants exist.
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_customers_tenantId_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_customers_tenantId_email"`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_customers_tenantId_phone"
      ON "customers" ("tenantId", "phone")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_customers_tenantId_email"
      ON "customers" ("tenantId", LOWER("email"))
      WHERE "email" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_customers_tenantId_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_customers_tenantId_phone"`);

    await queryRunner.query(`
      CREATE INDEX "IDX_customers_tenantId_phone" ON "customers" ("tenantId", "phone")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_tenantId_email" ON "customers" ("tenantId", "email")
    `);
  }
}
