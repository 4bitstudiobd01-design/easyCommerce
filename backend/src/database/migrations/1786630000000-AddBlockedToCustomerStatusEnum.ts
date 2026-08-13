import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockedToCustomerStatusEnum1786630000000 implements MigrationInterface {
  name = 'AddBlockedToCustomerStatusEnum1786630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."customers_status_enum" ADD VALUE IF NOT EXISTS 'BLOCKED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values in Postgres cannot be removed safely without recreating the type, so down migration is a no-op
  }
}
