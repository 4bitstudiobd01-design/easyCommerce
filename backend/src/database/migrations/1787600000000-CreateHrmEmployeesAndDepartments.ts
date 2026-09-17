import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmEmployeesAndDepartments1787600000000 implements MigrationInterface {
    name = 'CreateHrmEmployeesAndDepartments1787600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Defensive: every prior migration already relies on uuid_generate_v4() without
        // ever creating this extension, implying it's already enabled on the target
        // database. Guarding it here (idempotent, no-op if present) means this migration
        // also succeeds standalone against a genuinely fresh database.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "hr_departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "name" character varying(150) NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_departments" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_departments_storeId" ON "hr_departments" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_departments_storeId_name" ON "hr_departments" ("storeId", "name")`);

        await queryRunner.query(`CREATE TYPE "public"."hr_employees_employmenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN')`);
        await queryRunner.query(`CREATE TYPE "public"."hr_employees_employmentstatus_enum" AS ENUM('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')`);
        await queryRunner.query(`CREATE TYPE "public"."hr_employees_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "hr_employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "departmentId" uuid, "linkedUserId" uuid, "employeeCode" character varying(20) NOT NULL, "fullName" character varying(150) NOT NULL, "email" character varying(255), "phone" character varying(50), "designation" character varying(150), "employmentType" "public"."hr_employees_employmenttype_enum" NOT NULL DEFAULT 'FULL_TIME', "employmentStatus" "public"."hr_employees_employmentstatus_enum" NOT NULL DEFAULT 'ACTIVE', "dateOfJoining" date NOT NULL, "dateOfBirth" date, "gender" "public"."hr_employees_gender_enum", "address" text, "emergencyContactName" character varying(150), "emergencyContactPhone" character varying(50), "avatarUrl" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_employees" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_employees_storeId" ON "hr_employees" ("storeId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_hr_employees_storeId_employeeCode" ON "hr_employees" ("storeId", "employeeCode")`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD CONSTRAINT "FK_hr_employees_departmentId" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP CONSTRAINT "FK_hr_employees_departmentId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_employees_storeId_employeeCode"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_employees_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_employees"`);
        await queryRunner.query(`DROP TYPE "public"."hr_employees_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hr_employees_employmentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hr_employees_employmenttype_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_hr_departments_storeId_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_departments_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_departments"`);
    }

}
