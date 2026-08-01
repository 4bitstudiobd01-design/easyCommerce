import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventoryAndWarehouses1785599186825 implements MigrationInterface {
    name = 'AddInventoryAndWarehouses1785599186825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "variantId" uuid, "warehouseId" uuid NOT NULL, "quantityOnHand" integer NOT NULL DEFAULT '0', "quantityReserved" integer NOT NULL DEFAULT '0', "reorderPoint" integer NOT NULL DEFAULT '5', "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_092904cbd29becfe86bac755225" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "warehouses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "address" text, "phone" character varying(50), "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_stocks" ADD CONSTRAINT "FK_f7d658c94780e9bf3b67fa85f5b" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_stocks" ADD CONSTRAINT "FK_8ee12ab9f8a00d2763282d9b0eb" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT "FK_8ee12ab9f8a00d2763282d9b0eb"`);
        await queryRunner.query(`ALTER TABLE "inventory_stocks" DROP CONSTRAINT "FK_f7d658c94780e9bf3b67fa85f5b"`);
        await queryRunner.query(`DROP TABLE "warehouses"`);
        await queryRunner.query(`DROP TABLE "inventory_stocks"`);
    }

}
