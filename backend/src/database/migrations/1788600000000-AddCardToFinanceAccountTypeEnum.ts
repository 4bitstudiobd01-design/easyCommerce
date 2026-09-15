import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardToFinanceAccountTypeEnum1788600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."fin_accounts_type_enum" ADD VALUE IF NOT EXISTS 'CARD'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values cannot be removed in PostgreSQL without dropping and recreating the type.
  }
}
