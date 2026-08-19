import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesTable1787157504567 implements MigrationInterface {
    name = 'AddFilesTable1787157504567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."files_fileabletype_enum" AS ENUM('PRODUCT', 'CATEGORY', 'STORE_LOGO', 'STORE_FAVICON', 'STORE_BANNER', 'BLOG_POST', 'USER_AVATAR', 'INVOICE', 'DOCUMENT', 'GENERAL')`);
        await queryRunner.query(`CREATE TYPE "public"."files_filetype_enum" AS ENUM('IMAGE', 'AVATAR', 'THUMBNAIL', 'BANNER', 'DOCUMENT', 'INVOICE', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileableId" character varying(255), "fileableType" "public"."files_fileabletype_enum" NOT NULL DEFAULT 'GENERAL', "fileName" character varying(255) NOT NULL, "fileType" "public"."files_filetype_enum" NOT NULL DEFAULT 'IMAGE', "url" text NOT NULL, "path" text NOT NULL, "mimeType" character varying(100) NOT NULL, "sizeInBytes" bigint NOT NULL, "tenantId" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_269610c73dc40cbf3e07e689b2" ON "files" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a8e6170fffb21149d8aad1945" ON "files" ("tenantId", "fileableType", "fileableId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5a8e6170fffb21149d8aad1945"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_269610c73dc40cbf3e07e689b2"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "public"."files_filetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."files_fileabletype_enum"`);
    }

}
