import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseModule1788500000000 implements MigrationInterface {
  name = 'CreatePurchaseModule1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── Widen acc_journal_entries_source_enum ─────────────────────
    // PURCHASE / SUPPLIER_PAYMENT are added for the purchase module's auto-posted entries.
    // Rename-recreate-swap so it stays inside the migration's transaction (ALTER TYPE ...
    // ADD VALUE cannot). Matches 1787430294576-AddPartiallyPaidStatus.ts.
    await queryRunner.query(
      `ALTER TYPE "public"."acc_journal_entries_source_enum" RENAME TO "acc_journal_entries_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_journal_entries_source_enum" AS ENUM('MANUAL', 'EXPENSE', 'ORDER', 'PAYMENT', 'INVENTORY', 'OPENING_BALANCE', 'PURCHASE', 'SUPPLIER_PAYMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" TYPE "public"."acc_journal_entries_source_enum" USING "source"::"text"::"public"."acc_journal_entries_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(`DROP TYPE "public"."acc_journal_entries_source_enum_old"`);

    // ─── Enums ─────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."pur_suppliers_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pur_purchase_orders_status_enum" AS ENUM('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pur_bills_paymentstatus_enum" AS ENUM('UNPAID', 'PARTIAL', 'PAID')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pur_bills_status_enum" AS ENUM('OPEN', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pur_supplier_payments_method_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'MOBILE_BANKING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pur_number_counters_kind_enum" AS ENUM('PO', 'BILL', 'PAYMENT')`,
    );

    // ─── pur_suppliers ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "contactPerson" character varying(120),
        "email" character varying(150),
        "phone" character varying(40),
        "location" character varying(200),
        "status" "public"."pur_suppliers_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "openingBalance" numeric(18,2) NOT NULL DEFAULT '0',
        "notes" character varying(500),
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pur_suppliers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_suppliers_storeId" ON "pur_suppliers" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pur_suppliers_storeId_name" ON "pur_suppliers" ("storeId", "name")`,
    );

    // ─── pur_purchase_orders ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "poNumber" character varying(40) NOT NULL,
        "supplierId" uuid NOT NULL,
        "supplierName" character varying(150) NOT NULL,
        "orderDate" date NOT NULL,
        "expectedDate" date,
        "status" "public"."pur_purchase_orders_status_enum" NOT NULL DEFAULT 'DRAFT',
        "subtotal" numeric(18,2) NOT NULL DEFAULT '0',
        "totalAmount" numeric(18,2) NOT NULL DEFAULT '0',
        "receivedValue" numeric(18,2) NOT NULL DEFAULT '0',
        "notes" character varying(500),
        "billId" uuid,
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pur_purchase_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_purchase_orders_storeId" ON "pur_purchase_orders" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_purchase_orders_storeId_status" ON "pur_purchase_orders" ("storeId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_purchase_orders_storeId_supplierId" ON "pur_purchase_orders" ("storeId", "supplierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_purchase_orders_storeId_orderDate" ON "pur_purchase_orders" ("storeId", "orderDate")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pur_purchase_orders_storeId_poNumber" ON "pur_purchase_orders" ("storeId", "poNumber")`,
    );

    // ─── pur_purchase_order_lines ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_purchase_order_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "purchaseOrderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "variantId" uuid,
        "productName" character varying(200) NOT NULL,
        "sku" character varying(100),
        "quantity" integer NOT NULL,
        "receivedQuantity" integer NOT NULL DEFAULT 0,
        "unitCost" numeric(18,2) NOT NULL,
        "lineTotal" numeric(18,2) NOT NULL DEFAULT '0',
        "lineOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_pur_purchase_order_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pur_purchase_order_lines_purchaseOrderId" FOREIGN KEY ("purchaseOrderId")
          REFERENCES "pur_purchase_orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_purchase_order_lines_purchaseOrderId" ON "pur_purchase_order_lines" ("purchaseOrderId")`,
    );

    // ─── pur_bills ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_bills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "billNumber" character varying(40) NOT NULL,
        "supplierInvoiceNo" character varying(80),
        "supplierId" uuid NOT NULL,
        "supplierName" character varying(150) NOT NULL,
        "purchaseOrderId" uuid,
        "billDate" date NOT NULL,
        "dueDate" date,
        "subtotal" numeric(18,2) NOT NULL DEFAULT '0',
        "totalAmount" numeric(18,2) NOT NULL DEFAULT '0',
        "paidAmount" numeric(18,2) NOT NULL DEFAULT '0',
        "itemsCount" integer NOT NULL DEFAULT 0,
        "paymentStatus" "public"."pur_bills_paymentstatus_enum" NOT NULL DEFAULT 'UNPAID',
        "status" "public"."pur_bills_status_enum" NOT NULL DEFAULT 'OPEN',
        "journalEntryId" uuid,
        "notes" character varying(500),
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pur_bills" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pur_bills_storeId" ON "pur_bills" ("storeId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_bills_storeId_paymentStatus" ON "pur_bills" ("storeId", "paymentStatus")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_bills_storeId_supplierId" ON "pur_bills" ("storeId", "supplierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_bills_storeId_billDate" ON "pur_bills" ("storeId", "billDate")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pur_bills_storeId_billNumber" ON "pur_bills" ("storeId", "billNumber")`,
    );

    // ─── pur_bill_lines ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_bill_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "billId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "variantId" uuid,
        "productName" character varying(200) NOT NULL,
        "sku" character varying(100),
        "quantity" integer NOT NULL,
        "unitCost" numeric(18,2) NOT NULL,
        "lineTotal" numeric(18,2) NOT NULL DEFAULT '0',
        "lineOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_pur_bill_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pur_bill_lines_billId" FOREIGN KEY ("billId")
          REFERENCES "pur_bills"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_bill_lines_billId" ON "pur_bill_lines" ("billId")`,
    );

    // ─── pur_supplier_payments ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_supplier_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "paymentNumber" character varying(40) NOT NULL,
        "supplierId" uuid NOT NULL,
        "supplierName" character varying(150) NOT NULL,
        "billId" uuid,
        "paymentDate" date NOT NULL,
        "amount" numeric(18,2) NOT NULL,
        "method" "public"."pur_supplier_payments_method_enum" NOT NULL DEFAULT 'CASH',
        "paidFromAccountId" uuid,
        "reference" character varying(120),
        "journalEntryId" uuid,
        "notes" character varying(300),
        "createdByUserId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pur_supplier_payments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_supplier_payments_storeId" ON "pur_supplier_payments" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_supplier_payments_storeId_billId" ON "pur_supplier_payments" ("storeId", "billId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_supplier_payments_storeId_supplierId" ON "pur_supplier_payments" ("storeId", "supplierId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pur_supplier_payments_storeId_paymentNumber" ON "pur_supplier_payments" ("storeId", "paymentNumber")`,
    );

    // ─── pur_number_counters ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pur_number_counters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "storeId" uuid NOT NULL,
        "kind" "public"."pur_number_counters_kind_enum" NOT NULL,
        "prefix" character varying(12) NOT NULL DEFAULT '',
        "nextSequence" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pur_number_counters" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pur_number_counters_storeId" ON "pur_number_counters" ("storeId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pur_number_counters_storeId_kind" ON "pur_number_counters" ("storeId", "kind")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pur_number_counters"`);
    await queryRunner.query(`DROP TABLE "pur_supplier_payments"`);
    await queryRunner.query(`DROP TABLE "pur_bill_lines"`);
    await queryRunner.query(`DROP TABLE "pur_bills"`);
    await queryRunner.query(`DROP TABLE "pur_purchase_order_lines"`);
    await queryRunner.query(`DROP TABLE "pur_purchase_orders"`);
    await queryRunner.query(`DROP TABLE "pur_suppliers"`);

    await queryRunner.query(`DROP TYPE "public"."pur_number_counters_kind_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pur_supplier_payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pur_bills_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pur_bills_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pur_purchase_orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pur_suppliers_status_enum"`);

    // Narrow acc_journal_entries_source_enum back to its original six values. The USING cast
    // fails if any journal entry already has source = 'PURCHASE' / 'SUPPLIER_PAYMENT' — that
    // is the correct behaviour for a down migration (you must not roll back past data that
    // depends on the schema), matching the existing enum-narrowing migrations.
    await queryRunner.query(
      `ALTER TYPE "public"."acc_journal_entries_source_enum" RENAME TO "acc_journal_entries_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."acc_journal_entries_source_enum" AS ENUM('MANUAL', 'EXPENSE', 'ORDER', 'PAYMENT', 'INVENTORY', 'OPENING_BALANCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" TYPE "public"."acc_journal_entries_source_enum" USING "source"::"text"::"public"."acc_journal_entries_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acc_journal_entries" ALTER COLUMN "source" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(`DROP TYPE "public"."acc_journal_entries_source_enum_old"`);
  }
}
