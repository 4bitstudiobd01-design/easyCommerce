import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchIdToOrders1788542572247 implements MigrationInterface {
  name = 'AddBranchIdToOrders1788542572247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Weak reference to branches.id — no FK constraint, per the module
    // boundary rule (Order must not hold a cross-module entity relation).
    // Null means the order is not attributed to a physical outlet.
    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN "branchId" uuid NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN "branchId"
    `);
  }
}
