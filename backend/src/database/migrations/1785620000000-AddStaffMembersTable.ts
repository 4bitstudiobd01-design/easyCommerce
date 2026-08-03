import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaffMembersTable1785620000000 implements MigrationInterface {
  name = 'AddStaffMembersTable1785620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "staff_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "userId" uuid,
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(50),
        "role" character varying(100) NOT NULL DEFAULT 'STORE_STAFF',
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "status" character varying(50) NOT NULL DEFAULT 'PENDING_INVITE',
        "inviteToken" character varying(255),
        "inviteExpiresAt" TIMESTAMP WITH TIME ZONE,
        "invitedByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_members_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_staff_members_tenantId" ON "staff_members" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_staff_members_storeId" ON "staff_members" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_staff_members_email" ON "staff_members" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_staff_members_inviteToken" ON "staff_members" ("inviteToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_staff_members_inviteToken"`);
    await queryRunner.query(`DROP INDEX "IDX_staff_members_email"`);
    await queryRunner.query(`DROP INDEX "IDX_staff_members_storeId"`);
    await queryRunner.query(`DROP INDEX "IDX_staff_members_tenantId"`);
    await queryRunner.query(`DROP TABLE "staff_members"`);
  }
}
