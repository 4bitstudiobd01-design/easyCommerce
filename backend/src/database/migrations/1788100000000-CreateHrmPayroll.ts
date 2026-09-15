import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmPayroll1788100000000 implements MigrationInterface {
    name = 'CreateHrmPayroll1788100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "hr_salary_structures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "employeeId" uuid NOT NULL, "basicSalary" numeric(12,2) NOT NULL, "houseRentAllowance" numeric(12,2) NOT NULL DEFAULT '0', "medicalAllowance" numeric(12,2) NOT NULL DEFAULT '0', "conveyanceAllowance" numeric(12,2) NOT NULL DEFAULT '0', "otherAllowance" numeric(12,2) NOT NULL DEFAULT '0', "providentFundDeduction" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_hr_salary_structures_employeeId" UNIQUE ("employeeId"), CONSTRAINT "PK_hr_salary_structures" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_salary_structures_storeId" ON "hr_salary_structures" ("storeId")`);
        await queryRunner.query(`ALTER TABLE "hr_salary_structures" ADD CONSTRAINT "FK_hr_salary_structures_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TYPE "public"."hr_payroll_runs_status_enum" AS ENUM('DRAFT', 'FINALIZED', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "hr_payroll_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "status" "public"."hr_payroll_runs_status_enum" NOT NULL DEFAULT 'DRAFT', "totalGrossAmount" numeric(14,2) NOT NULL DEFAULT '0', "totalDeductions" numeric(14,2) NOT NULL DEFAULT '0', "totalNetAmount" numeric(14,2) NOT NULL DEFAULT '0', "skippedEmployeeCount" integer NOT NULL DEFAULT '0', "finalizedAt" TIMESTAMP WITH TIME ZONE, "paidAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_payroll_runs" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_payroll_runs_storeId" ON "hr_payroll_runs" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_payroll_runs_storeId_year_month" ON "hr_payroll_runs" ("storeId", "year", "month")`);

        await queryRunner.query(`CREATE TABLE "hr_payslips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "payrollRunId" uuid NOT NULL, "employeeId" uuid NOT NULL, "basicSalary" numeric(12,2) NOT NULL, "houseRentAllowance" numeric(12,2) NOT NULL DEFAULT '0', "medicalAllowance" numeric(12,2) NOT NULL DEFAULT '0', "conveyanceAllowance" numeric(12,2) NOT NULL DEFAULT '0', "otherAllowance" numeric(12,2) NOT NULL DEFAULT '0', "grossSalary" numeric(12,2) NOT NULL, "providentFundDeduction" numeric(12,2) NOT NULL DEFAULT '0', "taxDeduction" numeric(12,2) NOT NULL DEFAULT '0', "otherDeductions" numeric(12,2) NOT NULL DEFAULT '0', "netSalary" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_payslips" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_payslips_storeId" ON "hr_payslips" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_payslips_payrollRunId_employeeId" ON "hr_payslips" ("payrollRunId", "employeeId")`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" ADD CONSTRAINT "FK_hr_payslips_payrollRunId" FOREIGN KEY ("payrollRunId") REFERENCES "hr_payroll_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" ADD CONSTRAINT "FK_hr_payslips_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_payslips" DROP CONSTRAINT "FK_hr_payslips_employeeId"`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" DROP CONSTRAINT "FK_hr_payslips_payrollRunId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_payslips_payrollRunId_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_payslips_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_payslips"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_hr_payroll_runs_storeId_year_month"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_payroll_runs_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_payroll_runs"`);
        await queryRunner.query(`DROP TYPE "public"."hr_payroll_runs_status_enum"`);

        await queryRunner.query(`ALTER TABLE "hr_salary_structures" DROP CONSTRAINT "FK_hr_salary_structures_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_salary_structures_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_salary_structures"`);
    }

}
