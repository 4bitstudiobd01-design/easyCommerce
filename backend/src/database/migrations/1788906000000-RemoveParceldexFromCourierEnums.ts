import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the Parceldex courier integration entirely.
 *
 * The adapter, registry entry and `CourierProviderEnum.PARCELDEX` have been
 * removed from the codebase. This migration removes the matching database state:
 * the stored `courier_integrations` rows for Parceldex, then the 'PARCELDEX'
 * value from both courier-provider enums.
 *
 * Rename-recreate-swap (not `ALTER TYPE ... DROP VALUE`, which Postgres does not
 * support). Matches 1787430294576-AddPartiallyPaidStatus.ts.
 */
export class RemoveParceldexFromCourierEnums1788906000000 implements MigrationInterface {
  name = 'RemoveParceldexFromCourierEnums1788906000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // A value can only leave the enum once no row references it.
    await queryRunner.query(
      `DELETE FROM "courier_integrations" WHERE "provider" = 'PARCELDEX'`,
    );
    await queryRunner.query(
      `DELETE FROM "consignments" WHERE "courierProvider" = 'PARCELDEX'`,
    );

    // consignments.courierProvider (has a default of 'STEADFAST')
    await queryRunner.query(
      `ALTER TYPE "public"."consignments_courierprovider_enum" RENAME TO "consignments_courierprovider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consignments_courierprovider_enum" AS ENUM('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX', 'CARRYBEE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" TYPE "public"."consignments_courierprovider_enum" USING "courierProvider"::"text"::"public"."consignments_courierprovider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" SET DEFAULT 'STEADFAST'`,
    );
    await queryRunner.query(`DROP TYPE "public"."consignments_courierprovider_enum_old"`);

    // courier_integrations.provider (no column default)
    await queryRunner.query(
      `ALTER TYPE "public"."courier_integrations_provider_enum" RENAME TO "courier_integrations_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."courier_integrations_provider_enum" AS ENUM('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX', 'CARRYBEE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "courier_integrations" ALTER COLUMN "provider" TYPE "public"."courier_integrations_provider_enum" USING "provider"::"text"::"public"."courier_integrations_provider_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."courier_integrations_provider_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restores 'PARCELDEX' as a valid enum value. Deleted rows are not recreated.
    await queryRunner.query(
      `ALTER TYPE "public"."courier_integrations_provider_enum" RENAME TO "courier_integrations_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."courier_integrations_provider_enum" AS ENUM('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX', 'PARCELDEX', 'CARRYBEE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "courier_integrations" ALTER COLUMN "provider" TYPE "public"."courier_integrations_provider_enum" USING "provider"::"text"::"public"."courier_integrations_provider_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."courier_integrations_provider_enum_old"`);

    await queryRunner.query(
      `ALTER TYPE "public"."consignments_courierprovider_enum" RENAME TO "consignments_courierprovider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consignments_courierprovider_enum" AS ENUM('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX', 'PARCELDEX', 'CARRYBEE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" TYPE "public"."consignments_courierprovider_enum" USING "courierProvider"::"text"::"public"."consignments_courierprovider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consignments" ALTER COLUMN "courierProvider" SET DEFAULT 'STEADFAST'`,
    );
    await queryRunner.query(`DROP TYPE "public"."consignments_courierprovider_enum_old"`);
  }
}
