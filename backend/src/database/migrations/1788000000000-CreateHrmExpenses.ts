import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmExpenses1788000000000 implements MigrationInterface {
    name = 'CreateHrmExpenses1788000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TYPE "public"."hr_expenses_category_enum" AS ENUM('TRAVEL', 'MEALS', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'UTILITIES', 'MEDICAL', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."hr_expenses_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED')`);
        await queryRunner.query(`CREATE TABLE "hr_expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "employeeId" uuid NOT NULL, "category" "public"."hr_expenses_category_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'BDT', "expenseDate" date NOT NULL, "description" text, "receiptFileId" uuid, "status" "public"."hr_expenses_status_enum" NOT NULL DEFAULT 'PENDING', "reviewedByUserId" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewNote" text, "reimbursedAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_expenses" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_expenses_storeId" ON "hr_expenses" ("storeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_expenses_employeeId" ON "hr_expenses" ("employeeId")`);
        await queryRunner.query(`ALTER TABLE "hr_expenses" ADD CONSTRAINT "FK_hr_expenses_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_expenses" DROP CONSTRAINT "FK_hr_expenses_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_expenses_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_expenses_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_expenses"`);
        await queryRunner.query(`DROP TYPE "public"."hr_expenses_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hr_expenses_category_enum"`);
    }

}
