import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRecruitmentModule1789600000000 implements MigrationInterface {
    name = 'CreateRecruitmentModule1789600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hr_job_postings_status_enum" AS ENUM('OPEN', 'ON_HOLD', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "hr_job_postings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "title" character varying(150) NOT NULL, "departmentId" uuid, "employmentType" "public"."hr_employees_employmenttype_enum", "location" character varying(150), "openings" integer NOT NULL DEFAULT 1, "status" "public"."hr_job_postings_status_enum" NOT NULL DEFAULT 'OPEN', "description" text, "postedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_job_postings" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_job_postings_storeId" ON "hr_job_postings" ("storeId")`);
        await queryRunner.query(`ALTER TABLE "hr_job_postings" ADD CONSTRAINT "FK_hr_job_postings_departmentId" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TYPE "public"."hr_candidates_stage_enum" AS ENUM('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "hr_candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "jobPostingId" uuid NOT NULL, "fullName" character varying(150) NOT NULL, "email" character varying(255), "phone" character varying(50), "source" character varying(100), "stage" "public"."hr_candidates_stage_enum" NOT NULL DEFAULT 'APPLIED', "notes" text, "appliedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "hiredAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_candidates" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_candidates_storeId" ON "hr_candidates" ("storeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_candidates_jobPostingId" ON "hr_candidates" ("jobPostingId")`);
        await queryRunner.query(`ALTER TABLE "hr_candidates" ADD CONSTRAINT "FK_hr_candidates_jobPostingId" FOREIGN KEY ("jobPostingId") REFERENCES "hr_job_postings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TYPE "public"."hr_interviews_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "hr_interviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "candidateId" uuid NOT NULL, "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "durationMinutes" integer NOT NULL DEFAULT 30, "interviewerNames" character varying(255), "meetingLink" text, "status" "public"."hr_interviews_status_enum" NOT NULL DEFAULT 'SCHEDULED', "feedback" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_interviews" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_interviews_storeId" ON "hr_interviews" ("storeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_interviews_candidateId" ON "hr_interviews" ("candidateId")`);
        await queryRunner.query(`ALTER TABLE "hr_interviews" ADD CONSTRAINT "FK_hr_interviews_candidateId" FOREIGN KEY ("candidateId") REFERENCES "hr_candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_interviews" DROP CONSTRAINT "FK_hr_interviews_candidateId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_interviews_candidateId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_interviews_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_interviews"`);
        await queryRunner.query(`DROP TYPE "public"."hr_interviews_status_enum"`);

        await queryRunner.query(`ALTER TABLE "hr_candidates" DROP CONSTRAINT "FK_hr_candidates_jobPostingId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_candidates_jobPostingId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_candidates_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_candidates"`);
        await queryRunner.query(`DROP TYPE "public"."hr_candidates_stage_enum"`);

        await queryRunner.query(`ALTER TABLE "hr_job_postings" DROP CONSTRAINT "FK_hr_job_postings_departmentId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_job_postings_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_job_postings"`);
        await queryRunner.query(`DROP TYPE "public"."hr_job_postings_status_enum"`);
    }

}
