import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerAddressesTable1786600000000 implements MigrationInterface {
  name = 'AddCustomerAddressesTable1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer_addresses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid,
        "customerId" uuid NOT NULL,
        "label" varchar(50) NOT NULL DEFAULT 'Home',
        "recipientName" varchar(100) NOT NULL,
        "phone" varchar(30) NOT NULL,
        "addressLine1" text NOT NULL,
        "addressLine2" text,
        "area" varchar(100),
        "thana" varchar(100),
        "district" varchar(100),
        "division" varchar(100),
        "city" varchar(100) NOT NULL DEFAULT 'Dhaka',
        "postalCode" varchar(20),
        "country" varchar(100) NOT NULL DEFAULT 'Bangladesh',
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_addresses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_addresses_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_addresses_customerId" ON "customer_addresses" ("customerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_addresses_tenantId" ON "customer_addresses" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_customer_addresses_tenantId_customerId" ON "customer_addresses" ("tenantId", "customerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_tenantId_customerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_tenantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_customerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_addresses"`);
  }
}
