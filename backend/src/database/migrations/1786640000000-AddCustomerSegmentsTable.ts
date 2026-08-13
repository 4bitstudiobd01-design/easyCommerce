import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerSegmentsTable1786640000000 implements MigrationInterface {
  name = 'AddCustomerSegmentsTable1786640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying(255) NOT NULL,
        "storeId" character varying(255),
        "name" character varying(150) NOT NULL,
        "description" text,
        "rules" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_segments_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_segments_tenantId" ON "customer_segments" ("tenantId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_segments_tenantId_isActive" ON "customer_segments" ("tenantId", "isActive");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_segments";`);
  }
}
