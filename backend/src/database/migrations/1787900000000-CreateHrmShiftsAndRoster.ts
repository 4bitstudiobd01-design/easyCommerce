import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmShiftsAndRoster1787900000000 implements MigrationInterface {
    name = 'CreateHrmShiftsAndRoster1787900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "hr_shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "name" character varying(100) NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "colorTag" character varying(20) NOT NULL DEFAULT '#2563EB', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_shifts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_shifts_storeId" ON "hr_shifts" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_shifts_storeId_name" ON "hr_shifts" ("storeId", "name")`);

        await queryRunner.query(`CREATE TABLE "hr_shift_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "employeeId" uuid NOT NULL, "shiftId" uuid NOT NULL, "date" date NOT NULL, "assignedByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_shift_assignments" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_shift_assignments_storeId" ON "hr_shift_assignments" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_shift_assignments_employeeId_date" ON "hr_shift_assignments" ("employeeId", "date")`);
        await queryRunner.query(`ALTER TABLE "hr_shift_assignments" ADD CONSTRAINT "FK_hr_shift_assignments_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_shift_assignments" ADD CONSTRAINT "FK_hr_shift_assignments_shiftId" FOREIGN KEY ("shiftId") REFERENCES "hr_shifts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_shift_assignments" DROP CONSTRAINT "FK_hr_shift_assignments_shiftId"`);
        await queryRunner.query(`ALTER TABLE "hr_shift_assignments" DROP CONSTRAINT "FK_hr_shift_assignments_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_shift_assignments_employeeId_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_shift_assignments_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_shift_assignments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_shifts_storeId_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_shifts_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_shifts"`);
    }

}
