import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchModule1788542572246 implements MigrationInterface {
  name = 'CreateBranchModule1788542572246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "code" character varying(100) NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "address" text,
        "city" character varying(100),
        "phone" character varying(50),
        "email" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_branches_storeId_code" UNIQUE ("storeId", "code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_branches_tenantId_storeId" ON "branches" ("tenantId", "storeId")
    `);

    await queryRunner.query(`
      ALTER TABLE "branches"
      ADD CONSTRAINT "FK_branches_storeId"
      FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_branches_storeId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_branches_tenantId_storeId"`);
    await queryRunner.query(`DROP TABLE "branches"`);
  }
}
