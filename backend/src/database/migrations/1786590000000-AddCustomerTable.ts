import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerTable1786590000000 implements MigrationInterface {
    name = 'AddCustomerTable1786590000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."customers_status_enum" AS ENUM('ACTIVE', 'INACTIVE')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."customers_source_enum" AS ENUM('ONLINE_STORE', 'MANUAL', 'POS', 'IMPORT')
        `);
        await queryRunner.query(`
            CREATE TABLE "customers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "storeId" uuid,
                "firstName" character varying(100) NOT NULL,
                "lastName" character varying(100) NOT NULL,
                "email" character varying(255),
                "phone" character varying(50) NOT NULL,
                "status" "public"."customers_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "source" "public"."customers_source_enum" NOT NULL DEFAULT 'ONLINE_STORE',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenantId" ON "customers" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_storeId" ON "customers" ("storeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenantId_phone" ON "customers" ("tenantId", "phone")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenantId_email" ON "customers" ("tenantId", "email")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenantId_status" ON "customers" ("tenantId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_customers_tenantId_createdAt" ON "customers" ("tenantId", "createdAt")`);

        // Add foreign key constraint on OrderEntity for customerId if needed
        await queryRunner.query(`CREATE INDEX "IDX_orders_customerId" ON "orders" ("customerId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_customerId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenantId_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenantId_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenantId_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenantId_phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_storeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customers_tenantId"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TYPE "public"."customers_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customers_status_enum"`);
    }
}
