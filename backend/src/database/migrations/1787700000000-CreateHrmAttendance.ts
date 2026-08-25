import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmAttendance1787700000000 implements MigrationInterface {
    name = 'CreateHrmAttendance1787700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hr_attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE')`);
        await queryRunner.query(`CREATE TABLE "hr_attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "employeeId" uuid NOT NULL, "date" date NOT NULL, "status" "public"."hr_attendance_status_enum" NOT NULL, "checkInAt" TIMESTAMP WITH TIME ZONE, "checkOutAt" TIMESTAMP WITH TIME ZONE, "notes" text, "markedByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_attendance" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_attendance_storeId" ON "hr_attendance" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_attendance_employeeId_date" ON "hr_attendance" ("employeeId", "date")`);
        await queryRunner.query(`ALTER TABLE "hr_attendance" ADD CONSTRAINT "FK_hr_attendance_employeeId" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_attendance" DROP CONSTRAINT "FK_hr_attendance_employeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_attendance_employeeId_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_attendance_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_attendance"`);
        await queryRunner.query(`DROP TYPE "public"."hr_attendance_status_enum"`);
    }

}
