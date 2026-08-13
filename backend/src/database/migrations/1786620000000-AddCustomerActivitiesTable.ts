import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerActivitiesTable1786620000000 implements MigrationInterface {
  name = 'AddCustomerActivitiesTable1786620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer_activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid,
        "customerId" uuid NOT NULL,
        "eventType" varchar(100) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "actorName" varchar(100) NOT NULL DEFAULT 'System',
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_activities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_activities_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_activities_customerId" ON "customer_activities" ("customerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_activities_tenantId" ON "customer_activities" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_activities_tenantId_customerId" ON "customer_activities" ("tenantId", "customerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_activities_tenantId_customerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_activities_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_activities_customerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_activities"`);
  }
}
