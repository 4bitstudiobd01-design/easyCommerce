import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrdersAndOrderItems1785602072589 implements MigrationInterface {
    name = 'AddOrdersAndOrderItems1785602072589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "productTitle" character varying(255) NOT NULL, "sku" character varying(100), "unitPrice" numeric(12,2) NOT NULL, "quantity" integer NOT NULL, "totalPrice" numeric(12,2) NOT NULL, "orderId" uuid NOT NULL, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentmethod_enum" AS ENUM('COD', 'BKASH', 'NAGAD')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('UNPAID', 'PAID', 'REFUNDED')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_orderstatus_enum" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderNumber" character varying(50) NOT NULL, "customerName" character varying(255) NOT NULL, "customerPhone" character varying(50) NOT NULL, "customerEmail" character varying(255), "shippingAddress" text NOT NULL, "city" character varying(100) NOT NULL DEFAULT 'Dhaka', "deliveryFee" numeric(12,2) NOT NULL DEFAULT '60', "subtotal" numeric(12,2) NOT NULL, "grandTotal" numeric(12,2) NOT NULL, "paymentMethod" "public"."orders_paymentmethod_enum" NOT NULL DEFAULT 'COD', "paymentStatus" "public"."orders_paymentstatus_enum" NOT NULL DEFAULT 'UNPAID', "orderStatus" "public"."orders_orderstatus_enum" NOT NULL DEFAULT 'PENDING', "storeSlug" character varying(100) NOT NULL, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_orderstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
    }

}
