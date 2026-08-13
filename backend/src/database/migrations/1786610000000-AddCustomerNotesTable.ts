import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerNotesTable1786610000000 implements MigrationInterface {
  name = 'AddCustomerNotesTable1786610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer_notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid,
        "customerId" uuid NOT NULL,
        "authorId" uuid,
        "authorName" varchar(100) NOT NULL DEFAULT 'Merchant',
        "content" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_notes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_notes_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_notes_customerId" ON "customer_notes" ("customerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_notes_tenantId" ON "customer_notes" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_notes_tenantId_customerId" ON "customer_notes" ("tenantId", "customerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_notes_tenantId_customerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_notes_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_notes_customerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_notes"`);
  }
}
