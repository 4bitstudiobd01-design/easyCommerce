import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmLeaveAndHolidays1787800000000 implements MigrationInterface {
    name = 'CreateHrmLeaveAndHolidays1787800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "name" character varying(150) NOT NULL, "date" date NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_holidays" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_holidays_storeId" ON "hr_holidays" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_holidays_storeId_date" ON "hr_holidays" ("storeId", "date")`);

        await queryRunner.query(`CREATE TABLE "hr_leave_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "earnedDaysPerYear" integer NOT NULL DEFAULT 15, "casualDaysPerYear" integer NOT NULL DEFAULT 10, "sickDaysPerYear" integer NOT NULL DEFAULT 14, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_hr_leave_policies_storeId" UNIQUE ("storeId"), CONSTRAINT "PK_hr_leave_policies" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_leave_policies_storeId" ON "hr_leave_policies" ("storeId")`);

        await queryRunner.query(`CREATE TYPE "public"."hr_leave_requests_leavetype_enum" AS ENUM('EARNED', 'CASUAL', 'SICK')`);
        await queryRunner.query(`CREATE TYPE "public"."hr_leave_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "hr_leave_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "employeeId" uuid NOT NULL, "leaveType" "public"."hr_leave_requests_leavetype_enum" NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "totalDays" integer NOT NULL, "reason" text, "status" "public"."hr_leave_requests_status_enum" NOT NULL DEFAULT 'PENDING', "documentFileId" uuid, "reviewedByUserId" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewNote" text, "createdByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_leave_requests" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_leave_requests_storeId" ON "hr_leave_requests" ("storeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_leave_requests_employeeId" ON "hr_leave_requests" ("employeeId")`);
        await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "FK_hr_leave_requests_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP CONSTRAINT "FK_hr_leave_requests_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_leave_requests_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_leave_requests_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_leave_requests"`);
        await queryRunner.query(`DROP TYPE "public"."hr_leave_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hr_leave_requests_leavetype_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_hr_leave_policies_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_leave_policies"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_hr_holidays_storeId_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_holidays_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_holidays"`);
    }

}
