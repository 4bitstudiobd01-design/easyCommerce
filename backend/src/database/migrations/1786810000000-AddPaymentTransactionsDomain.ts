import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payment Transactions domain foundation.
 *
 * Extends the existing `payments` table (never replaces it) with the gateway /
 * method separation, customer + refund linkage and merchant-facing transaction
 * numbers required by the Payments → Transactions dashboard, and adds the
 * `payment_gateways` and `payment_events` tables.
 */
export class AddPaymentTransactionsDomain1786810000000 implements MigrationInterface {
  name = 'AddPaymentTransactionsDomain1786810000000';

  /**
   * TypeORM wraps each migration in a transaction, but PostgreSQL refuses to
   * *use* an enum value that was added in the still-open transaction
   * ("New enum values must be committed before they can be used", 55P04).
   *
   * Rebuilding the type instead of ALTER TYPE ... ADD VALUE keeps everything in
   * one atomic migration: the new type is created, the column is re-pointed at
   * it, and the old type is dropped — all usable immediately.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Replace the canonical payment status enum with one that also carries
    //    the post-settlement states.
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Fresh databases get the full enum straight from the entity metadata;
        -- only an existing, older type needs rebuilding.
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_status_enum') THEN
          CREATE TYPE "payments_status_enum" AS ENUM
            ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED',
             'PARTIALLY_REFUNDED', 'REFUNDED');
        ELSIF NOT EXISTS (
             SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'payments_status_enum' AND e.enumlabel = 'REFUNDED'
           ) THEN
          CREATE TYPE "payments_status_enum_new" AS ENUM
            ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED',
             'PARTIALLY_REFUNDED', 'REFUNDED');

          IF to_regclass('public.payments') IS NOT NULL THEN
            ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT;
            ALTER TABLE "payments"
              ALTER COLUMN "status" TYPE "payments_status_enum_new"
              USING "status"::text::"payments_status_enum_new";
            ALTER TABLE "payments"
              ALTER COLUMN "status" SET DEFAULT 'PENDING'::"payments_status_enum_new";
          END IF;

          DROP TYPE "payments_status_enum";
          ALTER TYPE "payments_status_enum_new" RENAME TO "payments_status_enum";
        END IF;
      END $$;
    `);

    // 2. Gateway and payment-method enum types (separate axes, deliberately).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_gateway_enum') THEN
          CREATE TYPE "payments_gateway_enum" AS ENUM
            ('SSLCOMMERZ', 'BKASH', 'NAGAD', 'STRIPE', 'PAYPAL', 'COD', 'MANUAL');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_paymentmethod_enum') THEN
          CREATE TYPE "payments_paymentmethod_enum" AS ENUM
            ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'CARD', 'BANK_TRANSFER', 'COD');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateways_status_enum') THEN
          CREATE TYPE "payment_gateways_status_enum" AS ENUM
            ('CONNECTED', 'DISCONNECTED', 'DISABLED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_events_type_enum') THEN
          CREATE TYPE "payment_events_type_enum" AS ENUM (
            'PAYMENT_INITIATED', 'GATEWAY_PROCESSING', 'WEBHOOK_RECEIVED',
            'PAYMENT_VERIFIED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED',
            'PAYMENT_CANCELLED', 'ORDER_UPDATED', 'REFUND_INITIATED',
            'REFUND_COMPLETED', 'REFUND_FAILED'
          );
        END IF;
      END $$;
    `);

    // 3. New columns on payments.
    await queryRunner.query(`
      ALTER TABLE "payments"
        ADD COLUMN IF NOT EXISTS "customerId" uuid,
        ADD COLUMN IF NOT EXISTS "transactionNumber" character varying(50),
        ADD COLUMN IF NOT EXISTS "refundedAmount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "gateway" "payments_gateway_enum" NOT NULL DEFAULT 'SSLCOMMERZ',
        ADD COLUMN IF NOT EXISTS "paymentMethod" "payments_paymentmethod_enum" NOT NULL DEFAULT 'CARD',
        ADD COLUMN IF NOT EXISTS "failureReason" text,
        ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP WITH TIME ZONE;
    `);

    // Refunded totals can never be negative or exceed the captured amount.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_payments_refunded_amount') THEN
          ALTER TABLE "payments" ADD CONSTRAINT "CHK_payments_refunded_amount"
          CHECK ("refundedAmount" >= 0 AND "refundedAmount" <= "amount");
        END IF;
      END $$;
    `);

    // 4. Backfill: derive customerId from the owning order, and paidAt for
    //    already-completed payments, so historical rows render correctly.
    await queryRunner.query(`
      UPDATE "payments" p
      SET "customerId" = o."customerId"
      FROM "orders" o
      WHERE p."orderId" = o."id"
        AND p."customerId" IS NULL
        AND o."customerId" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "payments"
      SET "paidAt" = "updatedAt"
      WHERE "status" = 'COMPLETED' AND "paidAt" IS NULL;
    `);

    // Derive the method for existing SSLCommerz rows from the stored card type.
    await queryRunner.query(`
      UPDATE "payments"
      SET "paymentMethod" = CASE
        WHEN UPPER(COALESCE("cardType", '')) LIKE '%BKASH%' THEN 'BKASH'::"payments_paymentmethod_enum"
        WHEN UPPER(COALESCE("cardType", '')) LIKE '%NAGAD%' THEN 'NAGAD'::"payments_paymentmethod_enum"
        WHEN UPPER(COALESCE("cardType", '')) LIKE '%ROCKET%'
          OR UPPER(COALESCE("cardType", '')) LIKE '%DBBLMOBILE%' THEN 'ROCKET'::"payments_paymentmethod_enum"
        WHEN UPPER(COALESCE("cardType", '')) LIKE '%UPAY%' THEN 'UPAY'::"payments_paymentmethod_enum"
        ELSE 'CARD'::"payments_paymentmethod_enum"
      END
      WHERE "cardType" IS NOT NULL;
    `);

    // Merchant-facing transaction numbers for pre-existing rows.
    await queryRunner.query(`
      UPDATE "payments" p
      SET "transactionNumber" = 'TXN-' || LPAD(seq.rn::text, 5, '0')
      FROM (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) + 10000 AS rn
        FROM "payments" WHERE "transactionNumber" IS NULL
      ) seq
      WHERE p."id" = seq."id" AND p."transactionNumber" IS NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_tenant_txn_number"
      ON "payments" ("tenantId", "transactionNumber")
      WHERE "transactionNumber" IS NOT NULL;
    `);

    // 5. Tenant-scoped query indexes matching the dashboard's actual filters.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_created" ON "payments" ("tenantId", "createdAt");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_status" ON "payments" ("tenantId", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_gateway" ON "payments" ("tenantId", "gateway");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_method" ON "payments" ("tenantId", "paymentMethod");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_order" ON "payments" ("tenantId", "orderId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_customer" ON "payments" ("tenantId", "customerId");
    `);

    // 6. payment_gateways — connection registry, never stores credentials.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_gateways" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" "payments_gateway_enum" NOT NULL,
        "name" character varying(100) NOT NULL,
        "kind" character varying(50) NOT NULL,
        "status" "payment_gateways_status_enum" NOT NULL DEFAULT 'DISCONNECTED',
        "isEnabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_gateways" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_gateways_tenant_code"
      ON "payment_gateways" ("tenantId", "code");
    `);

    // 7. payment_events — timeline + webhook idempotency ledger.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentId" uuid NOT NULL,
        "type" "payment_events_type_enum" NOT NULL,
        "message" text,
        "externalEventId" character varying(190),
        "metadata" jsonb,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_events" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_events_payment') THEN
          ALTER TABLE "payment_events"
          ADD CONSTRAINT "FK_payment_events_payment"
          FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_events_tenant_payment"
      ON "payment_events" ("tenantId", "paymentId");
    `);
    // Webhook idempotency: the same gateway event can never be applied twice.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_events_external_id"
      ON "payment_events" ("paymentId", "externalEventId")
      WHERE "externalEventId" IS NOT NULL;
    `);

    // 8. Refund query indexes (refund totals are aggregated per payment).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refunds_tenant_payment" ON "refunds" ("tenantId", "paymentId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refunds_tenant_status" ON "refunds" ("tenantId", "status");
    `);

    // 9. Backfill refundedAmount from completed refunds, then reconcile status.
    await queryRunner.query(`
      UPDATE "payments" p
      SET "refundedAmount" = LEAST(agg.total, p."amount")
      FROM (
        SELECT "paymentId", SUM("amount") AS total
        FROM "refunds" WHERE "status" = 'COMPLETED' GROUP BY "paymentId"
      ) agg
      WHERE p."id" = agg."paymentId";
    `);
    await queryRunner.query(`
      UPDATE "payments"
      SET "status" = CASE
        WHEN "refundedAmount" >= "amount" THEN 'REFUNDED'::"payments_status_enum"
        ELSE 'PARTIALLY_REFUNDED'::"payments_status_enum"
      END
      WHERE "refundedAmount" > 0 AND "status" = 'COMPLETED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_gateways";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_events_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_gateways_status_enum";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refunds_tenant_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refunds_tenant_payment";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_customer";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_method";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_gateway";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_created";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_txn_number";`);

    await queryRunner.query(`
      ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "CHK_payments_refunded_amount";
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
        DROP COLUMN IF EXISTS "paidAt",
        DROP COLUMN IF EXISTS "failureReason",
        DROP COLUMN IF EXISTS "paymentMethod",
        DROP COLUMN IF EXISTS "gateway",
        DROP COLUMN IF EXISTS "refundedAmount",
        DROP COLUMN IF EXISTS "transactionNumber",
        DROP COLUMN IF EXISTS "customerId";
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "payments_paymentmethod_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payments_gateway_enum";`);
    // Postgres cannot remove enum values; PROCESSING/REFUNDED/PARTIALLY_REFUNDED
    // remain on payments_status_enum, which is harmless and non-breaking.
  }
}
