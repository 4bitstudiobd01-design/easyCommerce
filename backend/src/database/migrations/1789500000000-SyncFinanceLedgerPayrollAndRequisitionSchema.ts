import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Brings every database in line with the Finance / HRM-payroll / Purchase entities.
 *
 * Several schema pieces were only ever created by `onModuleInit` raw SQL in
 * PurchaseModule / FinanceModule (fin_requisitions, PO PENDING_APPROVAL/APPROVED) or
 * never created at all (double-entry ledger tables, payroll payment columns, new
 * finance enum values). That startup SQL is removed alongside this migration.
 *
 * Every statement is idempotent so it is safe on a fresh database, on a database where
 * the startup SQL already ran, and on one that is partially in sync.
 */
export class SyncFinanceLedgerPayrollAndRequisitionSchema1789500000000
  implements MigrationInterface
{
  name = 'SyncFinanceLedgerPayrollAndRequisitionSchema1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Purchase order status: PENDING_APPROVAL / APPROVED ─────────────────────────
    await this.recreateEnumIfMissingValue(
      queryRunner,
      'pur_purchase_orders',
      'status',
      'pur_purchase_orders_status_enum',
      'PENDING_APPROVAL',
      ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'],
      'DRAFT',
      [],
    );

    // ── Finance enums: new values used by current services ─────────────────────────
    await this.recreateEnumIfMissingValue(
      queryRunner,
      'fin_transactions',
      'sourceType',
      'fin_transactions_sourcetype_enum',
      'REQUISITION',
      ['MANUAL', 'ORDER', 'INVOICE', 'BILL', 'HR_EXPENSE', 'PAYROLL', 'TRANSFER', 'ADJUSTMENT', 'REQUISITION'],
      'MANUAL',
      [],
    );
    await this.recreateEnumIfMissingValue(
      queryRunner,
      'fin_invoices',
      'status',
      'fin_invoices_status_enum',
      'PENDING',
      ['DRAFT', 'PENDING', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'],
      'PENDING',
      ['IDX_fin_invoices_storeId_status'],
    );
    await this.recreateEnumIfMissingValue(
      queryRunner,
      'fin_bills',
      'status',
      'fin_bills_status_enum',
      'PENDING',
      ['DRAFT', 'PENDING', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'],
      'PENDING',
      ['IDX_fin_bills_storeId_status'],
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_invoices_storeId_status" ON "fin_invoices" ("storeId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_bills_storeId_status" ON "fin_bills" ("storeId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_transactions_store_account" ON "fin_transactions" ("storeId", "accountId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_transactions_store_type_date" ON "fin_transactions" ("storeId", "type", "transactionDate")`,
    );

    // ── fin_requisitions (previously created only by FinanceModule startup SQL) ────
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fin_requisitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "requisitionNumber" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "category" character varying(50) NOT NULL DEFAULT 'PURCHASE', "purchaseOrderId" uuid, "poNumber" character varying(50), "supplierId" uuid, "supplierName" character varying(200), "requestedAmount" numeric(14,2) NOT NULL DEFAULT '0', "requestDate" date NOT NULL, "requiredDate" date, "status" character varying(30) NOT NULL DEFAULT 'PENDING', "priority" character varying(30) NOT NULL DEFAULT 'NORMAL', "notes" text, "items" jsonb DEFAULT '[]', "paidFromAccountId" uuid, "paymentMethod" character varying(50), "paymentReference" character varying(150), "disbursedAmount" numeric(14,2), "financeTransactionId" uuid, "rejectionReason" text, "approvedAt" TIMESTAMP WITH TIME ZONE, "approvedByUserId" uuid, "approvedByName" character varying(150), "createdByUserId" uuid, "createdByName" character varying(150), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_dbdbc73c36a5b9d49d12afccd35" PRIMARY KEY ("id"))`,
    );
    // The startup SQL created this index as non-unique; the entity declares it unique.
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = 'IDX_fin_requisitions_storeId_reqNumber'
            AND indexdef NOT ILIKE 'CREATE UNIQUE INDEX%'
        ) THEN
          DROP INDEX "public"."IDX_fin_requisitions_storeId_reqNumber";
        END IF;
      END $$`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fin_requisitions_storeId_reqNumber" ON "fin_requisitions" ("storeId", "requisitionNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_requisitions_tenantId_storeId" ON "fin_requisitions" ("tenantId", "storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_requisitions_storeId_status" ON "fin_requisitions" ("storeId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_requisitions_tenantId" ON "fin_requisitions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_requisitions_storeId" ON "fin_requisitions" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_requisitions_poId" ON "fin_requisitions" ("purchaseOrderId")`,
    );

    // ── Double-entry ledger tables ──────────────────────────────────────────────────
    await this.createEnumIfMissing(queryRunner, 'fin_journal_entries_sourcetype_enum', [
      'MANUAL', 'ORDER', 'REFUND', 'INVOICE', 'BILL', 'PAYROLL', 'HR_EXPENSE', 'TRANSFER', 'INVENTORY_ADJUSTMENT', 'PERIOD_CLOSING',
    ]);
    await this.createEnumIfMissing(queryRunner, 'fin_journal_entries_status_enum', ['DRAFT', 'POSTED', 'VOID']);
    await this.createEnumIfMissing(queryRunner, 'fin_chart_of_accounts_accountclass_enum', [
      'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
    ]);
    await this.createEnumIfMissing(queryRunner, 'fin_chart_of_accounts_normalbalance_enum', ['DEBIT', 'CREDIT']);
    await this.createEnumIfMissing(queryRunner, 'fin_journal_lines_type_enum', ['DEBIT', 'CREDIT']);
    await this.createEnumIfMissing(queryRunner, 'fin_journal_lines_partytype_enum', [
      'CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'COURIER', 'NONE',
    ]);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fin_period_locks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "periodName" character varying(100) NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "isLocked" boolean NOT NULL DEFAULT true, "lockedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lockedByUserId" uuid, "lockedByName" character varying(150), "notes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6af6c468fdd23feec03262e4267" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_period_tenantId" ON "fin_period_locks" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_period_storeId" ON "fin_period_locks" ("storeId")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_period_tenantId_storeId" ON "fin_period_locks" ("tenantId", "storeId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fin_journal_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "entryNumber" character varying(50) NOT NULL, "entryDate" date NOT NULL, "postingDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sourceType" "public"."fin_journal_entries_sourcetype_enum" NOT NULL DEFAULT 'MANUAL', "sourceId" character varying(100), "sourceReference" character varying(100), "description" text NOT NULL, "notes" text, "totalDebit" numeric(14,2) NOT NULL DEFAULT '0', "totalCredit" numeric(14,2) NOT NULL DEFAULT '0', "isBalanced" boolean NOT NULL DEFAULT true, "status" "public"."fin_journal_entries_status_enum" NOT NULL DEFAULT 'POSTED', "currency" character varying(10) NOT NULL DEFAULT 'BDT', "postedByUserId" uuid, "postedByName" character varying(150), "auditMetadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c1812a2bb1f7fc6da66132efc39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_je_tenantId" ON "fin_journal_entries" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_je_storeId" ON "fin_journal_entries" ("storeId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fin_je_number" ON "fin_journal_entries" ("storeId", "entryNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_je_entryDate" ON "fin_journal_entries" ("storeId", "entryDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_je_tenantId_storeId" ON "fin_journal_entries" ("tenantId", "storeId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fin_chart_of_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(150) NOT NULL, "accountClass" "public"."fin_chart_of_accounts_accountclass_enum" NOT NULL, "subType" character varying(50) NOT NULL DEFAULT 'GENERAL', "normalBalance" "public"."fin_chart_of_accounts_normalbalance_enum" NOT NULL, "parentId" uuid, "currentBalance" numeric(14,2) NOT NULL DEFAULT '0', "currency" character varying(10) NOT NULL DEFAULT 'BDT', "description" text, "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0ece3b28d4dd3f49b79c5a83b86" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_coa_tenantId" ON "fin_chart_of_accounts" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_coa_storeId" ON "fin_chart_of_accounts" ("storeId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fin_coa_code" ON "fin_chart_of_accounts" ("storeId", "code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_coa_tenantId_storeId" ON "fin_chart_of_accounts" ("tenantId", "storeId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fin_journal_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "storeId" uuid NOT NULL, "journalEntryId" uuid NOT NULL, "accountId" uuid NOT NULL, "accountCode" character varying(20) NOT NULL, "accountName" character varying(150) NOT NULL, "type" "public"."fin_journal_lines_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "description" text, "partyType" "public"."fin_journal_lines_partytype_enum" NOT NULL DEFAULT 'NONE', "partyId" character varying(100), "partyName" character varying(150), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f09b9b9da047ab7c58589f558d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_jl_account" ON "fin_journal_lines" ("accountId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fin_jl_entry" ON "fin_journal_lines" ("journalEntryId")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fin_jl_tenantId_storeId" ON "fin_journal_lines" ("tenantId", "storeId")`,
    );

    // ── Payroll payment tracking ────────────────────────────────────────────────────
    await this.createEnumIfMissing(queryRunner, 'hr_payroll_runs_paymentstatus_enum', ['UNPAID', 'PARTIALLY_PAID', 'PAID']);
    await this.createEnumIfMissing(queryRunner, 'hr_payslips_paymentstatus_enum', ['UNPAID', 'PAID']);
    await this.createEnumIfMissing(queryRunner, 'hr_payslips_paymentmethod_enum', [
      'CASH', 'BANK_TRANSFER', 'MOBILE_BANKING', 'CHEQUE',
    ]);
    await queryRunner.query(
      `ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "paymentStatus" "public"."hr_payroll_runs_paymentstatus_enum" NOT NULL DEFAULT 'UNPAID'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "totalPaidAmount" numeric(14,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "paidEmployeeCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "approvedByUserId" uuid`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "financeLiabilityTransactionId" uuid`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD COLUMN IF NOT EXISTS "financeJournalEntryId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paymentStatus" "public"."hr_payslips_paymentstatus_enum" NOT NULL DEFAULT 'UNPAID'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paymentMethod" "public"."hr_payslips_paymentmethod_enum" DEFAULT 'CASH'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paidAmount" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paidByUserId" uuid`);
    await queryRunner.query(`ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "paymentReference" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "financeTransactionId" uuid`);
    await queryRunner.query(`ALTER TABLE "hr_payslips" ADD COLUMN IF NOT EXISTS "financeAccountId" uuid`);

    // ── Column defaults that drifted from the entities ─────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "stores" ALTER COLUMN "checkoutFieldConfig" SET DEFAULT '{"email":{"show":true,"required":false},"address":{"show":true,"required":true},"country":{"show":true,"required":true},"division":{"show":true,"required":true},"district":{"show":true,"required":true},"cityArea":{"show":true,"required":true},"zipCode":{"show":true,"required":false},"orderNote":{"show":true,"required":false}}'`,
    );
    await queryRunner.query(`ALTER TABLE "consignments" ALTER COLUMN "parcelWeight" SET DEFAULT '0.5'`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "features" SET DEFAULT '[]'::jsonb`);

    // ── Foreign keys ────────────────────────────────────────────────────────────────
    await this.addForeignKeyIfMissing(
      queryRunner,
      'fin_transactions',
      'FK_5c5f3de56f3f904581646acecaf',
      `FOREIGN KEY ("receiptFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'fin_transactions',
      'FK_3a0de58b81573bd251eb31d1f81',
      `FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'fin_chart_of_accounts',
      'FK_b80d73f5ea18e5da84ddb320e2b',
      `FOREIGN KEY ("parentId") REFERENCES "fin_chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'fin_journal_lines',
      'FK_4634a9ff30fc97c8318d24ab4d0',
      `FOREIGN KEY ("journalEntryId") REFERENCES "fin_journal_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'fin_journal_lines',
      'FK_6bc987a7485defa5d70469405d1',
      `FOREIGN KEY ("accountId") REFERENCES "fin_chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only objects this migration can be sure it introduced are removed. Enum values are
    // left in place: removing them would fail for any row already using them, and
    // fin_requisitions / PO approval states predate this migration on existing databases.
    await queryRunner.query(`ALTER TABLE "fin_journal_lines" DROP CONSTRAINT IF EXISTS "FK_6bc987a7485defa5d70469405d1"`);
    await queryRunner.query(`ALTER TABLE "fin_journal_lines" DROP CONSTRAINT IF EXISTS "FK_4634a9ff30fc97c8318d24ab4d0"`);
    await queryRunner.query(`ALTER TABLE "fin_chart_of_accounts" DROP CONSTRAINT IF EXISTS "FK_b80d73f5ea18e5da84ddb320e2b"`);
    await queryRunner.query(`ALTER TABLE "fin_transactions" DROP CONSTRAINT IF EXISTS "FK_3a0de58b81573bd251eb31d1f81"`);
    await queryRunner.query(`ALTER TABLE "fin_transactions" DROP CONSTRAINT IF EXISTS "FK_5c5f3de56f3f904581646acecaf"`);

    for (const column of [
      'financeAccountId', 'financeTransactionId', 'paymentReference', 'paidByUserId', 'paidAt', 'paidAmount',
      'paymentMethod', 'paymentStatus',
    ]) {
      await queryRunner.query(`ALTER TABLE "hr_payslips" DROP COLUMN IF EXISTS "${column}"`);
    }
    for (const column of [
      'financeJournalEntryId', 'financeLiabilityTransactionId', 'approvedByUserId', 'paidEmployeeCount',
      'totalPaidAmount', 'paymentStatus',
    ]) {
      await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP COLUMN IF EXISTS "${column}"`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."hr_payslips_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."hr_payslips_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."hr_payroll_runs_paymentstatus_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "fin_journal_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fin_chart_of_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fin_journal_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fin_period_locks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_journal_lines_partytype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_journal_lines_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_chart_of_accounts_normalbalance_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_chart_of_accounts_accountclass_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_journal_entries_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fin_journal_entries_sourcetype_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_fin_transactions_store_type_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_fin_transactions_store_account"`);
  }

  private async createEnumIfMissing(queryRunner: QueryRunner, typeName: string, values: string[]): Promise<void> {
    const labels = values.map((v) => `'${v}'`).join(', ');
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."${typeName}" AS ENUM(${labels});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
    );
  }

  /**
   * Swaps an enum type for one with the full value list when `probeValue` is missing.
   * A rename/recreate (not ALTER TYPE ... ADD VALUE) is used so the new values are
   * usable inside the same migration transaction, e.g. as a column default.
   */
  private async recreateEnumIfMissingValue(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    typeName: string,
    probeValue: string,
    values: string[],
    defaultValue: string,
    dependentIndexes: string[],
  ): Promise<void> {
    const rows: Array<{ present: boolean }> = await queryRunner.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = $1 AND e.enumlabel = $2
      ) AS present`,
      [typeName, probeValue],
    );
    if (rows[0]?.present) return;

    const labels = values.map((v) => `'${v}'`).join(', ');
    for (const index of dependentIndexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "public"."${index}"`);
    }
    await queryRunner.query(`ALTER TYPE "public"."${typeName}" RENAME TO "${typeName}_old"`);
    await queryRunner.query(`CREATE TYPE "public"."${typeName}" AS ENUM(${labels})`);
    await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE "public"."${typeName}" USING "${column}"::"text"::"public"."${typeName}"`,
    );
    await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${defaultValue}'`);
    await queryRunner.query(`DROP TYPE "public"."${typeName}_old"`);
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    definition: string,
  ): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}') THEN
          ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" ${definition};
        END IF;
      END $$`,
    );
  }
}
