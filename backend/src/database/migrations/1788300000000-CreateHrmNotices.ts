import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrmNotices1788300000000 implements MigrationInterface {
    name = 'CreateHrmNotices1788300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TYPE "public"."hr_notices_priority_enum" AS ENUM('NORMAL', 'IMPORTANT', 'URGENT')`);
        await queryRunner.query(`CREATE TABLE "hr_notices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "title" character varying(200) NOT NULL, "body" text NOT NULL, "priority" "public"."hr_notices_priority_enum" NOT NULL DEFAULT 'NORMAL', "isPinned" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_notices" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_hr_notices_storeId" ON "hr_notices" ("storeId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_hr_notices_storeId"`);
        await queryRunner.query(`DROP TABLE "hr_notices"`);
        await queryRunner.query(`DROP TYPE "public"."hr_notices_priority_enum"`);
    }

}
