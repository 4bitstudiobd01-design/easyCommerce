import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchIdToJournalEntriesAndLines1788542572400 implements MigrationInterface {
  name = 'AddBranchIdToJournalEntriesAndLines1788542572400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Weak reference to branches.id — no FK constraint, per the module
    // boundary rule (Accounting must not hold a cross-module entity relation).
    // Null means the entry/line is not attributed to a physical outlet
    // (store-wide or online).
    await queryRunner.query(`
      ALTER TABLE "acc_journal_entries" ADD COLUMN "branchId" uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "acc_journal_lines" ADD COLUMN "branchId" uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_acc_journal_entries_branchId" ON "acc_journal_entries" ("branchId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_acc_journal_lines_branchId" ON "acc_journal_lines" ("branchId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_acc_journal_lines_branchId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_acc_journal_entries_branchId"`);

    await queryRunner.query(`ALTER TABLE "acc_journal_lines" DROP COLUMN "branchId"`);
    await queryRunner.query(`ALTER TABLE "acc_journal_entries" DROP COLUMN "branchId"`);
  }
}
