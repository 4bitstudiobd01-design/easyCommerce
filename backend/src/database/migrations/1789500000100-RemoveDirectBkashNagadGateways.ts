import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * bKash and Nagad are payment methods processed by SSLCommerz, not gateways of their
 * own (no direct integration exists). Drops them from the gateway enums so they can no
 * longer be configured or recorded as a gateway. Payment-method enums are untouched.
 *
 * Any row still pointing at the removed values is moved to SSLCOMMERZ first, which is
 * the gateway that actually processes those methods.
 */
const GATEWAY_COLUMNS: Array<{ table: string; column: string; type: string; defaultValue: string | null }> = [
  { table: 'payments', column: 'gateway', type: 'payments_gateway_enum', defaultValue: 'SSLCOMMERZ' },
  { table: 'payment_gateways', column: 'code', type: 'payment_gateways_code_enum', defaultValue: null },
];

export class RemoveDirectBkashNagadGateways1789500000100 implements MigrationInterface {
  name = 'RemoveDirectBkashNagadGateways1789500000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column, type, defaultValue } of GATEWAY_COLUMNS) {
      const rows: Array<{ present: boolean }> = await queryRunner.query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = $1 AND e.enumlabel IN ('BKASH', 'NAGAD')
        ) AS present`,
        [type],
      );
      if (!rows[0]?.present) continue;

      await queryRunner.query(
        `UPDATE "${table}" SET "${column}" = 'SSLCOMMERZ' WHERE "${column}"::text IN ('BKASH', 'NAGAD')`,
      );
      await this.swapEnum(queryRunner, table, column, type, ['SSLCOMMERZ', 'STRIPE', 'PAYPAL', 'COD', 'MANUAL'], defaultValue);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column, type, defaultValue } of GATEWAY_COLUMNS) {
      await this.swapEnum(
        queryRunner,
        table,
        column,
        type,
        ['SSLCOMMERZ', 'BKASH', 'NAGAD', 'STRIPE', 'PAYPAL', 'COD', 'MANUAL'],
        defaultValue,
      );
    }
  }

  private async swapEnum(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    type: string,
    values: string[],
    defaultValue: string | null,
  ): Promise<void> {
    const labels = values.map((v) => `'${v}'`).join(', ');
    await queryRunner.query(`ALTER TYPE "public"."${type}" RENAME TO "${type}_old"`);
    await queryRunner.query(`CREATE TYPE "public"."${type}" AS ENUM(${labels})`);
    await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE "public"."${type}" USING "${column}"::"text"::"public"."${type}"`,
    );
    if (defaultValue) {
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${defaultValue}'`);
    }
    await queryRunner.query(`DROP TYPE "public"."${type}_old"`);
  }
}
