import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponsTable1785609000000 implements MigrationInterface {
  name = 'AddCouponsTable1785609000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."coupons_discounttype_enum" AS ENUM('PERCENTAGE', 'FIXED');
    `);

    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "discountType" "public"."coupons_discounttype_enum" NOT NULL DEFAULT 'PERCENTAGE',
        "discountValue" numeric(10,2) NOT NULL,
        "minOrderAmount" numeric(10,2) NOT NULL DEFAULT '0',
        "maxUses" integer NOT NULL DEFAULT '100',
        "usedCount" integer NOT NULL DEFAULT '0',
        "expiryDate" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coupons_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_discounttype_enum"`);
  }
}
