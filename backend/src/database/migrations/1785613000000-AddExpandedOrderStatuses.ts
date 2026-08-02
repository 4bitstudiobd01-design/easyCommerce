import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpandedOrderStatuses1785613000000 implements MigrationInterface {
  name = 'AddExpandedOrderStatuses1785613000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alter orderStatus column in orders table to varchar(50) so all 11 order statuses can be saved seamlessly
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "orderStatus" TYPE varchar(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "orderStatus" SET DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "orderStatus" TYPE varchar(50)`,
    );
  }
}
