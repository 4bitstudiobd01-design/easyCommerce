import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttendanceDeductionPolicyAndPayslipFields1789800000000 implements MigrationInterface {
    name = 'AddAttendanceDeductionPolicyAndPayslipFields1789800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_attendance_deduction_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "lateArrivalsPerDeductedDay" integer NOT NULL DEFAULT 4, "deductUnmarkedAbsences" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_hr_attendance_deduction_policies_storeId" UNIQUE ("storeId"), CONSTRAINT "PK_hr_attendance_deduction_policies" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_attendance_deduction_policies_storeId" ON "hr_attendance_deduction_policies" ("storeId")`);

        await queryRunner.query(`ALTER TABLE "hr_payslips" ADD "attendanceDeduction" decimal(12,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" ADD "attendanceDeductionDays" decimal(6,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" ADD "attendanceDeductionBreakdown" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_payslips" DROP COLUMN "attendanceDeductionBreakdown"`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" DROP COLUMN "attendanceDeductionDays"`);
        await queryRunner.query(`ALTER TABLE "hr_payslips" DROP COLUMN "attendanceDeduction"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_hr_attendance_deduction_policies_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_attendance_deduction_policies"`);
    }

}
