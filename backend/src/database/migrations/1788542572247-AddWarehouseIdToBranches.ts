import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarehouseIdToBranches1788542572247 implements MigrationInterface {
  name = 'AddWarehouseIdToBranches1788542572247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "branches" ADD COLUMN "warehouseId" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "branches"
      ADD CONSTRAINT "FK_branches_warehouseId"
      FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_branches_warehouseId"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "warehouseId"`);
  }
}
