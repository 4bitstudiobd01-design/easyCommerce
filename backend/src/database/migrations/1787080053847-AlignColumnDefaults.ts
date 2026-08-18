import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignColumnDefaults1787080053847 implements MigrationInterface {
    name = 'AlignColumnDefaults1787080053847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "parcelWeight" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "features" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "features" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "parcelWeight" SET DEFAULT 0.5`);
    }

}
