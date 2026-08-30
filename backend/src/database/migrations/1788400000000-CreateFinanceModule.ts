import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinanceModule1788400000000 implements MigrationInterface {
  name = 'CreateFinanceModule1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(
      `CREATE TYPE "public"."fin_accounts_type_enum" AS ENUM('CASH', 'BANK', 'PAYMENT_GATEWAY', 'DIGITAL_WALLET')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_transactions_type_enum" AS ENUM('INCOME', 'EXPENSE', 'PAYMENT', 'REFUND', 'TRANSFER', 'ADJUSTMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_transactions_status_enum" AS ENUM('COMPLETED', 'PENDING', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_categories_type_enum" AS ENUM('INCOME', 'EXPENSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_invoices_status_enum" AS ENUM('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_bills_status_enum" AS ENUM('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_transfers_status_enum" AS ENUM('COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fin_source_type_enum" AS ENUM('MANUAL', 'ORDER', 'INVOICE', 'BILL', 'HR_EXPENSE', 'PAYROLL', 'TRANSFER', 'ADJUSTMENT')`,
    );

    // 2. Tables
    // fin_accounts
    await queryRunner.query(`
      CREATE TABLE "fin_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "type" "public"."fin_accounts_type_enum" NOT NULL DEFAULT 'BANK',
        "accountNumber" character varying(100),
        "bankOrProviderName" character varying(150),
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "currentBalance" numeric(14,2) NOT NULL DEFAULT 0,
        "startingBalance" numeric(14,2) NOT NULL DEFAULT 0,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_accounts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_accounts_tenantId" ON "fin_accounts" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_accounts_storeId" ON "fin_accounts" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_accounts_tenantId_storeId" ON "fin_accounts" ("tenantId", "storeId")`);

    // fin_categories
    await queryRunner.query(`
      CREATE TABLE "fin_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "code" character varying(50) NOT NULL,
        "type" "public"."fin_categories_type_enum" NOT NULL,
        "isSystem" boolean NOT NULL DEFAULT false,
        "color" character varying(30),
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_categories_tenantId" ON "fin_categories" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_categories_storeId" ON "fin_categories" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_categories_tenantId_storeId" ON "fin_categories" ("tenantId", "storeId")`);

    // fin_transactions
    await queryRunner.query(`
      CREATE TABLE "fin_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "transactionNumber" character varying(50) NOT NULL,
        "type" "public"."fin_transactions_type_enum" NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "transactionDate" date NOT NULL,
        "accountId" uuid,
        "toAccountId" uuid,
        "categoryId" uuid,
        "categoryCode" character varying(50),
        "description" text,
        "reference" character varying(100),
        "sourceType" "public"."fin_source_type_enum" NOT NULL DEFAULT 'MANUAL',
        "sourceId" uuid,
        "paymentMethod" character varying(50),
        "status" "public"."fin_transactions_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "receiptFileId" uuid,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_transactions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transactions_tenantId" ON "fin_transactions" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transactions_storeId" ON "fin_transactions" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transactions_accountId" ON "fin_transactions" ("accountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transactions_tenantId_storeId" ON "fin_transactions" ("tenantId", "storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transactions_date" ON "fin_transactions" ("storeId", "transactionDate")`);

    // fin_invoices
    await queryRunner.query(`
      CREATE TABLE "fin_invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "invoiceNumber" character varying(50) NOT NULL,
        "customerId" uuid,
        "customerName" character varying(200) NOT NULL,
        "customerEmail" character varying(255),
        "customerPhone" character varying(50),
        "customerAddress" text,
        "issueDate" date NOT NULL,
        "dueDate" date NOT NULL,
        "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "discountAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "paidAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "balanceDue" numeric(14,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "status" "public"."fin_invoices_status_enum" NOT NULL DEFAULT 'UNPAID',
        "notes" text,
        "terms" text,
        "orderId" uuid,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_invoices" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_invoices_tenantId" ON "fin_invoices" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_invoices_storeId" ON "fin_invoices" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_invoices_tenantId_storeId" ON "fin_invoices" ("tenantId", "storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_invoices_storeId_status" ON "fin_invoices" ("storeId", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fin_invoices_storeId_invoiceNumber" ON "fin_invoices" ("storeId", "invoiceNumber")`);

    // fin_invoice_items
    await queryRunner.query(`
      CREATE TABLE "fin_invoice_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "quantity" integer NOT NULL DEFAULT 1,
        "unitPrice" numeric(14,2) NOT NULL,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(14,2) NOT NULL,
        "productId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_invoice_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fin_invoice_items_invoice" FOREIGN KEY ("invoiceId") REFERENCES "fin_invoices"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_invoice_items_invoiceId" ON "fin_invoice_items" ("invoiceId")`);

    // fin_bills
    await queryRunner.query(`
      CREATE TABLE "fin_bills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "billNumber" character varying(50) NOT NULL,
        "supplierName" character varying(200) NOT NULL,
        "supplierContact" character varying(100),
        "supplierEmail" character varying(255),
        "category" character varying(50) NOT NULL DEFAULT 'OTHER',
        "issueDate" date NOT NULL,
        "dueDate" date NOT NULL,
        "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "paidAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "balanceDue" numeric(14,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "status" "public"."fin_bills_status_enum" NOT NULL DEFAULT 'UNPAID',
        "notes" text,
        "attachmentFileId" uuid,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_bills" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_bills_tenantId" ON "fin_bills" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_bills_storeId" ON "fin_bills" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_bills_tenantId_storeId" ON "fin_bills" ("tenantId", "storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_bills_storeId_status" ON "fin_bills" ("storeId", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fin_bills_storeId_billNumber" ON "fin_bills" ("storeId", "billNumber")`);

    // fin_bill_items
    await queryRunner.query(`
      CREATE TABLE "fin_bill_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "billId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "quantity" integer NOT NULL DEFAULT 1,
        "unitPrice" numeric(14,2) NOT NULL,
        "taxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "totalAmount" numeric(14,2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_bill_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fin_bill_items_bill" FOREIGN KEY ("billId") REFERENCES "fin_bills"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_bill_items_billId" ON "fin_bill_items" ("billId")`);

    // fin_transfers
    await queryRunner.query(`
      CREATE TABLE "fin_transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "transferNumber" character varying(50) NOT NULL,
        "fromAccountId" uuid NOT NULL,
        "toAccountId" uuid NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "fee" numeric(14,2) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "transferDate" date NOT NULL,
        "reference" character varying(100),
        "notes" text,
        "status" "public"."fin_transfers_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_transfers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fin_transfers_fromAccount" FOREIGN KEY ("fromAccountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_fin_transfers_toAccount" FOREIGN KEY ("toAccountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transfers_tenantId" ON "fin_transfers" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transfers_storeId" ON "fin_transfers" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transfers_fromAccountId" ON "fin_transfers" ("fromAccountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transfers_toAccountId" ON "fin_transfers" ("toAccountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_transfers_tenantId_storeId" ON "fin_transfers" ("tenantId", "storeId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fin_transfers_storeId_transferNumber" ON "fin_transfers" ("storeId", "transferNumber")`);

    // fin_settings
    await queryRunner.query(`
      CREATE TABLE "fin_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'BDT',
        "currencySymbol" character varying(10) NOT NULL DEFAULT '৳',
        "defaultTaxRate" numeric(5,2) NOT NULL DEFAULT 0,
        "taxNumber" character varying(100),
        "invoicePrefix" character varying(20) NOT NULL DEFAULT 'INV-',
        "billPrefix" character varying(20) NOT NULL DEFAULT 'BILL-',
        "defaultSalesAccountId" uuid,
        "defaultExpenseAccountId" uuid,
        "invoiceFooterNote" text,
        "invoiceTerms" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fin_settings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fin_settings_tenantId" ON "fin_settings" ("tenantId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fin_settings_storeId" ON "fin_settings" ("storeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_fin_settings_tenantId_storeId" ON "fin_settings" ("tenantId", "storeId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fin_settings"`);
    await queryRunner.query(`DROP TABLE "fin_transfers"`);
    await queryRunner.query(`DROP TABLE "fin_bill_items"`);
    await queryRunner.query(`DROP TABLE "fin_bills"`);
    await queryRunner.query(`DROP TABLE "fin_invoice_items"`);
    await queryRunner.query(`DROP TABLE "fin_invoices"`);
    await queryRunner.query(`DROP TABLE "fin_transactions"`);
    await queryRunner.query(`DROP TABLE "fin_categories"`);
    await queryRunner.query(`DROP TABLE "fin_accounts"`);

    await queryRunner.query(`DROP TYPE "public"."fin_source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_transfers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_bills_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_categories_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fin_accounts_type_enum"`);
  }
}
