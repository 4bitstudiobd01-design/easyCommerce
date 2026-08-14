import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shipment domain foundation for the Courier → Shipments dashboard.
 *
 * Extends the existing `consignments` table (never replaces it) with:
 *  - the PENDING / RETURNING lifecycle states and the REDX provider,
 *  - a merchant-facing shipment number and a nullable tracking code,
 *  - a first-class COD settlement model (pending → collected → settled),
 *  - parcel dimensions/weight/type and pickup address,
 *  - an idempotency key so a retried create cannot book two parcels,
 *  - the composite indexes the dashboard's filters and aggregates rely on.
 */
export class AddShipmentDomainForCourierDashboard1786820000000 implements MigrationInterface {
  name = 'AddShipmentDomainForCourierDashboard1786820000000';

  /**
   * TypeORM wraps each migration in a transaction, but PostgreSQL refuses to
   * *use* an enum value added in the still-open transaction (55P04). Rebuilding
   * the type instead of ALTER TYPE ... ADD VALUE keeps this atomic: the new type
   * is created, the column re-pointed at it, and the old type dropped.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nothing to migrate on a database that has never had the courier module.
    const hasTable = await queryRunner.hasTable('consignments');
    if (!hasTable) return;

    // 1. Shipment status enum — add PENDING and RETURNING.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'consignments_status_enum' AND e.enumlabel = 'RETURNING'
        ) THEN
          CREATE TYPE "consignments_status_enum_new" AS ENUM
            ('PENDING', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
             'DELIVERED', 'DELIVERY_FAILED', 'RETURNING', 'RETURNED', 'CANCELLED');

          ALTER TABLE "consignments" ALTER COLUMN "status" DROP DEFAULT;
          ALTER TABLE "consignments"
            ALTER COLUMN "status" TYPE "consignments_status_enum_new"
            USING "status"::text::"consignments_status_enum_new";
          ALTER TABLE "consignments"
            ALTER COLUMN "status" SET DEFAULT 'PENDING'::"consignments_status_enum_new";

          DROP TYPE "consignments_status_enum";
          ALTER TYPE "consignments_status_enum_new" RENAME TO "consignments_status_enum";
        END IF;
      END $$;
    `);

    // 2. Courier provider enum — add REDX.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'consignments_courierprovider_enum' AND e.enumlabel = 'REDX'
        ) THEN
          CREATE TYPE "consignments_courierprovider_enum_new" AS ENUM
            ('STEADFAST', 'PATHAO', 'PAPERFLY', 'REDX');

          ALTER TABLE "consignments" ALTER COLUMN "courierProvider" DROP DEFAULT;
          ALTER TABLE "consignments"
            ALTER COLUMN "courierProvider" TYPE "consignments_courierprovider_enum_new"
            USING "courierProvider"::text::"consignments_courierprovider_enum_new";
          ALTER TABLE "consignments"
            ALTER COLUMN "courierProvider"
            SET DEFAULT 'STEADFAST'::"consignments_courierprovider_enum_new";

          DROP TYPE "consignments_courierprovider_enum";
          ALTER TYPE "consignments_courierprovider_enum_new"
            RENAME TO "consignments_courierprovider_enum";
        END IF;
      END $$;
    `);

    // 3. COD settlement status.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consignments_codstatus_enum') THEN
          CREATE TYPE "consignments_codstatus_enum" AS ENUM
            ('NOT_APPLICABLE', 'PENDING', 'COLLECTED', 'SETTLED', 'RETURNED');
        END IF;
      END $$;
    `);

    // 4. New columns.
    await queryRunner.query(`
      ALTER TABLE "consignments"
        ADD COLUMN IF NOT EXISTS "shipmentNumber" character varying(50),
        ADD COLUMN IF NOT EXISTS "customerId" uuid,
        ADD COLUMN IF NOT EXISTS "pickupAddress" text,
        ADD COLUMN IF NOT EXISTS "codStatus" "consignments_codstatus_enum"
          NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS "codCollectedAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "codSettledAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "parcelWeight" numeric(8,3) NOT NULL DEFAULT 0.5,
        ADD COLUMN IF NOT EXISTS "parcelType" character varying(50) NOT NULL DEFAULT 'PARCEL',
        ADD COLUMN IF NOT EXISTS "parcelDimensions" character varying(100),
        ADD COLUMN IF NOT EXISTS "deliveryNote" text,
        ADD COLUMN IF NOT EXISTS "specialInstructions" text,
        ADD COLUMN IF NOT EXISTS "idempotencyKey" character varying(100)
    `);

    // 5. Backfill shipment numbers for parcels booked before this migration,
    //    numbering each tenant's rows independently from SHP-10001 upwards.
    await queryRunner.query(`
      WITH numbered AS (
        SELECT
          "id",
          'SHP-' || (10000 + ROW_NUMBER() OVER (
            PARTITION BY "tenantId" ORDER BY "createdAt", "id"
          ))::text AS generated_number
        FROM "consignments"
        WHERE "shipmentNumber" IS NULL
      )
      UPDATE "consignments" c
      SET "shipmentNumber" = n.generated_number
      FROM numbered n
      WHERE c."id" = n."id"
    `);

    await queryRunner.query(`
      ALTER TABLE "consignments" ALTER COLUMN "shipmentNumber" SET NOT NULL
    `);

    // 6. Backfill COD status from the order's payment state, so pre-existing
    //    parcels start in a COD state consistent with the money already taken.
    await queryRunner.query(`
      UPDATE "consignments" c
      SET "codStatus" = CASE
        WHEN c."codAmount" IS NULL OR c."codAmount" <= 0 THEN 'NOT_APPLICABLE'::"consignments_codstatus_enum"
        WHEN c."status" IN ('RETURNED', 'CANCELLED') THEN 'RETURNED'::"consignments_codstatus_enum"
        WHEN o."paymentStatus" = 'COD_COLLECTED' THEN 'COLLECTED'::"consignments_codstatus_enum"
        WHEN o."paymentStatus" = 'PAID' THEN 'NOT_APPLICABLE'::"consignments_codstatus_enum"
        ELSE 'PENDING'::"consignments_codstatus_enum"
      END
      FROM "orders" o
      WHERE o."id" = c."orderId"
    `);

    // 7. Backfill the customer reference from the order.
    await queryRunner.query(`
      UPDATE "consignments" c
      SET "customerId" = o."customerId"
      FROM "orders" o
      WHERE o."id" = c."orderId" AND c."customerId" IS NULL
    `);

    // 8. Tracking code becomes nullable — a PENDING parcel has no code yet, and
    //    uniqueness moves to a partial index so multiple NULLs stay legal.
    await queryRunner.query(`
      ALTER TABLE "consignments" ALTER COLUMN "trackingCode" DROP NOT NULL
    `);
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'consignments' AND con.contype = 'u'
          AND pg_get_constraintdef(con.oid) LIKE '%trackingCode%';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "consignments" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);

    // 9. Indexes serving the dashboard's dominant access patterns.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_consignments_tenant_shipment_number"
        ON "consignments" ("tenantId", "shipmentNumber")
    `);
    // Partial: only actually-booked parcels must carry a unique tracking code.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_consignments_tracking_code"
        ON "consignments" ("trackingCode") WHERE "trackingCode" IS NOT NULL
    `);
    // Partial: makes a retried create resolve to the original shipment.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_consignments_tenant_idempotency_key"
        ON "consignments" ("tenantId", "idempotencyKey") WHERE "idempotencyKey" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tracking_code"
        ON "consignments" ("trackingCode")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_customer" ON "consignments" ("customerId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tenant_created"
        ON "consignments" ("tenantId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tenant_status"
        ON "consignments" ("tenantId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tenant_cod_status"
        ON "consignments" ("tenantId", "codStatus")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tenant_courier"
        ON "consignments" ("tenantId", "courierProvider")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignments_tenant_order"
        ON "consignments" ("tenantId", "orderId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_consignment_events_consignment_time"
        ON "consignment_events" ("consignmentId", "eventTimestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('consignments');
    if (!hasTable) return;

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignment_events_consignment_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenant_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenant_courier"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenant_cod_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tenant_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_customer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consignments_tracking_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_consignments_tenant_idempotency_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_consignments_tracking_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_consignments_tenant_shipment_number"`);

    // Rows added while the new lifecycle was live must be mapped back before the
    // enum narrows, or the cast below fails.
    await queryRunner.query(`
      UPDATE "consignments" SET "status" = 'BOOKED' WHERE "status" = 'PENDING'
    `);
    await queryRunner.query(`
      UPDATE "consignments" SET "status" = 'RETURNED' WHERE "status" = 'RETURNING'
    `);
    await queryRunner.query(`
      UPDATE "consignments" SET "courierProvider" = 'STEADFAST' WHERE "courierProvider" = 'REDX'
    `);
    // A parcel with no tracking code cannot exist under the restored NOT NULL.
    await queryRunner.query(`
      UPDATE "consignments"
      SET "trackingCode" = 'RESTORED-' || "id"::text
      WHERE "trackingCode" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "consignments"
        DROP COLUMN IF EXISTS "idempotencyKey",
        DROP COLUMN IF EXISTS "specialInstructions",
        DROP COLUMN IF EXISTS "deliveryNote",
        DROP COLUMN IF EXISTS "parcelDimensions",
        DROP COLUMN IF EXISTS "parcelType",
        DROP COLUMN IF EXISTS "parcelWeight",
        DROP COLUMN IF EXISTS "codSettledAt",
        DROP COLUMN IF EXISTS "codCollectedAt",
        DROP COLUMN IF EXISTS "codStatus",
        DROP COLUMN IF EXISTS "pickupAddress",
        DROP COLUMN IF EXISTS "customerId",
        DROP COLUMN IF EXISTS "shipmentNumber"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "consignments_codstatus_enum"`);

    await queryRunner.query(`
      ALTER TABLE "consignments" ALTER COLUMN "trackingCode" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "consignments"
        ADD CONSTRAINT "UQ_consignments_trackingCode" UNIQUE ("trackingCode")
    `);

    await queryRunner.query(`
      CREATE TYPE "consignments_status_enum_old" AS ENUM
        ('BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
         'DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'CANCELLED');
      ALTER TABLE "consignments" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "consignments"
        ALTER COLUMN "status" TYPE "consignments_status_enum_old"
        USING "status"::text::"consignments_status_enum_old";
      ALTER TABLE "consignments"
        ALTER COLUMN "status" SET DEFAULT 'BOOKED'::"consignments_status_enum_old";
      DROP TYPE "consignments_status_enum";
      ALTER TYPE "consignments_status_enum_old" RENAME TO "consignments_status_enum";
    `);

    await queryRunner.query(`
      CREATE TYPE "consignments_courierprovider_enum_old" AS ENUM
        ('STEADFAST', 'PATHAO', 'PAPERFLY');
      ALTER TABLE "consignments" ALTER COLUMN "courierProvider" DROP DEFAULT;
      ALTER TABLE "consignments"
        ALTER COLUMN "courierProvider" TYPE "consignments_courierprovider_enum_old"
        USING "courierProvider"::text::"consignments_courierprovider_enum_old";
      ALTER TABLE "consignments"
        ALTER COLUMN "courierProvider"
        SET DEFAULT 'STEADFAST'::"consignments_courierprovider_enum_old";
      DROP TYPE "consignments_courierprovider_enum";
      ALTER TYPE "consignments_courierprovider_enum_old"
        RENAME TO "consignments_courierprovider_enum";
    `);
  }
}
