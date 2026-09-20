import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeProfileFields1789500000000 implements MigrationInterface {
    name = 'AddEmployeeProfileFields1789500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hr_employees_maritalstatus_enum" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')`);

        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "emergencyContactRelation" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "secondaryEmergencyContactName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "secondaryEmergencyContactPhone" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "secondaryEmergencyContactRelation" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "reportsToEmployeeId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "nationalId" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "passportNumber" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "passportExpiryDate" date`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "nationality" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "religion" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "maritalStatus" "public"."hr_employees_maritalstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "spouseName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "spouseEmployed" boolean`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "numberOfChildren" integer`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "bankName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "bankAccountNumber" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "bankBranchName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "bankRoutingNumber" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "education" jsonb`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD "experience" jsonb`);

        await queryRunner.query(`CREATE INDEX "IDX_hr_employees_reportsToEmployeeId" ON "hr_employees" ("reportsToEmployeeId")`);
        await queryRunner.query(`ALTER TABLE "hr_employees" ADD CONSTRAINT "FK_hr_employees_reportsToEmployeeId" FOREIGN KEY ("reportsToEmployeeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP CONSTRAINT "FK_hr_employees_reportsToEmployeeId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_employees_reportsToEmployeeId"`);

        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "experience"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "education"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "bankRoutingNumber"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "bankBranchName"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "bankAccountNumber"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "bankName"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "numberOfChildren"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "spouseEmployed"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "spouseName"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "maritalStatus"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "religion"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "passportExpiryDate"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "passportNumber"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "nationalId"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "reportsToEmployeeId"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "secondaryEmergencyContactRelation"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "secondaryEmergencyContactPhone"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "secondaryEmergencyContactName"`);
        await queryRunner.query(`ALTER TABLE "hr_employees" DROP COLUMN "emergencyContactRelation"`);

        await queryRunner.query(`DROP TYPE "public"."hr_employees_maritalstatus_enum"`);
    }

}
