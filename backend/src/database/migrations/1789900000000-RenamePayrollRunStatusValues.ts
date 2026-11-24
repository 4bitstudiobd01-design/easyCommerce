import { MigrationInterface, QueryRunner } from "typeorm";

export class RenamePayrollRunStatusValues1789900000000 implements MigrationInterface {
    name = 'RenamePayrollRunStatusValues1789900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."hr_payroll_runs_status_enum" RENAME VALUE 'DRAFT' TO 'REVIEW'`);
        await queryRunner.query(`ALTER TYPE "public"."hr_payroll_runs_status_enum" RENAME VALUE 'PAID' TO 'REIMBURSED'`);
        await queryRunner.query(`ALTER TABLE "hr_payroll_runs" RENAME COLUMN "paidAt" TO "reimbursedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_payroll_runs" RENAME COLUMN "reimbursedAt" TO "paidAt"`);
        await queryRunner.query(`ALTER TYPE "public"."hr_payroll_runs_status_enum" RENAME VALUE 'REIMBURSED' TO 'PAID'`);
        await queryRunner.query(`ALTER TYPE "public"."hr_payroll_runs_status_enum" RENAME VALUE 'REVIEW' TO 'DRAFT'`);
    }

}
