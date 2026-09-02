import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountingModule1788400000000 implements MigrationInterface {
  name = 'CreateAccountingModule1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── Enums ─────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."acc_accounts_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_accounts_normalbalance_enum" AS ENUM('DEBIT', 'CREDIT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_journal_entries_status_enum" AS ENUM('DRAFT', 'POSTED', 'VOID')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_journal_entries_source_enum" AS ENUM('MANUAL', 'EXPENSE', 'ORDER', 'PAYMENT', 'INVENTORY', 'OPENING_BALANCE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_expenses_paymentmethod_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'MOBILE_BANKING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_expenses_status_enum" AS ENUM('PAID', 'DUE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_account_mappings_event_enum" AS ENUM('SALES_REVENUE', 'SHIPPING_INCOME', 'COURIER_COST', 'PAYMENT_GATEWAY_FEE', 'SALES_RETURNS', 'COGS', 'INVENTORY_ASSET', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'CASH', 'BANK', 'TAX_PAYABLE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_numbering_rules_doctype_enum" AS ENUM('JOURNAL_ENTRY', 'EXPENSE', 'DEBIT_NOTE', 'CREDIT_NOTE')`,
    );

    // ─── acc_accounts ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "code" character varying(20) NOT NULL,
        "name" character varying(150) NOT NULL,
        "type" "public"."acc_accounts_type_enum" NOT NULL,
        "normalBalance" "public"."acc_accounts_normalbalance_enum" NOT NULL,
        "parentId" uuid,
        "description" text,
        "openingBalance" numeric(18,2) NOT NULL DEFAULT '0',
        "isSystem" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_accounts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_acc_accounts_storeId" ON "acc_accounts" ("storeId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_accounts_storeId_code" ON "acc_accounts" ("storeId", "code")`,
    );

    // ─── acc_journal_entries ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_journal_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "entryNumber" character varying(40) NOT NULL,
        "date" date NOT NULL,
        "description" character varying(300) NOT NULL,
        "reference" character varying(120),
        "status" "public"."acc_journal_entries_status_enum" NOT NULL DEFAULT 'DRAFT',
        "source" "public"."acc_journal_entries_source_enum" NOT NULL DEFAULT 'MANUAL',
        "sourceRef" character varying(120),
        "totalDebit" numeric(18,2) NOT NULL DEFAULT '0',
        "totalCredit" numeric(18,2) NOT NULL DEFAULT '0',
        "createdByUserId" uuid,
        "postedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_journal_entries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_journal_entries_storeId" ON "acc_journal_entries" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_journal_entries_storeId_date" ON "acc_journal_entries" ("storeId", "date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_journal_entries_sourceRef" ON "acc_journal_entries" ("sourceRef")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_journal_entries_storeId_entryNumber" ON "acc_journal_entries" ("storeId", "entryNumber")`,
    );

    // ─── acc_journal_lines ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_journal_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "journalEntryId" uuid NOT NULL,
        "accountId" uuid NOT NULL,
        "accountCode" character varying(20) NOT NULL,
        "accountName" character varying(150) NOT NULL,
        "debit" numeric(18,2) NOT NULL DEFAULT '0',
        "credit" numeric(18,2) NOT NULL DEFAULT '0',
        "memo" character varying(300),
        "lineOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_acc_journal_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_acc_journal_lines_journalEntryId" FOREIGN KEY ("journalEntryId")
          REFERENCES "acc_journal_entries"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_journal_lines_journalEntryId" ON "acc_journal_lines" ("journalEntryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_journal_lines_accountId" ON "acc_journal_lines" ("accountId")`,
    );

    // ─── acc_expenses ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "expenseNumber" character varying(40) NOT NULL,
        "date" date NOT NULL,
        "title" character varying(200) NOT NULL,
        "note" character varying(300),
        "category" character varying(80) NOT NULL,
        "vendor" character varying(150),
        "amount" numeric(18,2) NOT NULL,
        "paymentMethod" "public"."acc_expenses_paymentmethod_enum" NOT NULL DEFAULT 'CASH',
        "status" "public"."acc_expenses_status_enum" NOT NULL DEFAULT 'PAID',
        "expenseAccountId" uuid,
        "paidFromAccountId" uuid,
        "journalEntryId" uuid,
        "receiptUrl" text,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_expenses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_acc_expenses_storeId" ON "acc_expenses" ("storeId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_expenses_storeId_date" ON "acc_expenses" ("storeId", "date")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_expenses_storeId_expenseNumber" ON "acc_expenses" ("storeId", "expenseNumber")`,
    );

    // ─── acc_settings ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "fiscalYearStartMonth" integer NOT NULL DEFAULT 7,
        "baseCurrency" character varying(3) NOT NULL DEFAULT 'BDT',
        "autoPostEnabled" boolean NOT NULL DEFAULT true,
        "allowDraftEntries" boolean NOT NULL DEFAULT true,
        "chartSeeded" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_settings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_settings_storeId" ON "acc_settings" ("storeId")`,
    );

    // ─── acc_account_mappings ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_account_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "event" "public"."acc_account_mappings_event_enum" NOT NULL,
        "accountId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_account_mappings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_account_mappings_storeId" ON "acc_account_mappings" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_account_mappings_storeId_event" ON "acc_account_mappings" ("storeId", "event")`,
    );

    // ─── acc_numbering_rules ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "acc_numbering_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "docType" "public"."acc_numbering_rules_doctype_enum" NOT NULL,
        "prefix" character varying(12) NOT NULL DEFAULT '',
        "suffix" character varying(12) NOT NULL DEFAULT '',
        "includeYear" boolean NOT NULL DEFAULT true,
        "padWidth" integer NOT NULL DEFAULT 4,
        "nextSequence" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acc_numbering_rules" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_acc_numbering_rules_storeId" ON "acc_numbering_rules" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_acc_numbering_rules_storeId_docType" ON "acc_numbering_rules" ("storeId", "docType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "acc_numbering_rules"`);
    await queryRunner.query(`DROP TABLE "acc_account_mappings"`);
    await queryRunner.query(`DROP TABLE "acc_settings"`);
    await queryRunner.query(`DROP TABLE "acc_expenses"`);
    await queryRunner.query(`DROP TABLE "acc_journal_lines"`);
    await queryRunner.query(`DROP TABLE "acc_journal_entries"`);
    await queryRunner.query(`DROP TABLE "acc_accounts"`);

    await queryRunner.query(`DROP TYPE "public"."acc_numbering_rules_doctype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_account_mappings_event_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_expenses_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_expenses_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_journal_entries_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_journal_entries_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_accounts_normalbalance_enum"`);
    await queryRunner.query(`DROP TYPE "public"."acc_accounts_type_enum"`);
  }
}
