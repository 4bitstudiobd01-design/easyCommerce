import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnpaidLeaveType1789700000000 implements MigrationInterface {
    name = 'AddUnpaidLeaveType1789700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."hr_leave_requests_leavetype_enum" ADD VALUE IF NOT EXISTS 'UNPAID'`);
    }

    public async down(): Promise<void> {
        // Postgres cannot drop a single enum value without recreating the type and
        // rewriting every dependent column; intentionally a no-op down migration.
    }

}
