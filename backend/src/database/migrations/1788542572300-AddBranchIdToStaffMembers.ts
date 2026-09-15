import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchIdToStaffMembers1788542572300 implements MigrationInterface {
  name = 'AddBranchIdToStaffMembers1788542572300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "staff_members" ADD COLUMN "branchId" uuid NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "staff_members" DROP COLUMN "branchId"
    `);
  }
}
