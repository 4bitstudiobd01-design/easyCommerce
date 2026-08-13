import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductAttributesChunkSix1786700000000 implements MigrationInterface {
  name = 'AddProductAttributesChunkSix1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create attribute_definitions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attribute_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "key" character varying(255) NOT NULL,
        "type" character varying(50) NOT NULL DEFAULT 'TEXT',
        "description" text,
        "isRequired" boolean NOT NULL DEFAULT false,
        "isFilterable" boolean NOT NULL DEFAULT true,
        "isVariantOption" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attribute_definitions_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_definitions_tenant_key" ON "attribute_definitions" ("tenantId", "key");
    `);

    // 2. Create attribute_options table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attribute_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "label" character varying(255) NOT NULL,
        "value" character varying(255) NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "attributeId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attribute_options_id" PRIMARY KEY ("id")
      );
    `);

    // 3. Create category_attributes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "category_attributes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "categoryId" uuid NOT NULL,
        "attributeId" uuid NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category_attributes_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_attributes_cat_attr" ON "category_attributes" ("categoryId", "attributeId");
    `);

    // 4. Create product_attribute_values table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_attribute_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "attributeId" uuid NOT NULL,
        "value" text NOT NULL,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_attribute_values_id" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_values_prod_attr" ON "product_attribute_values" ("productId", "attributeId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_attribute_values"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category_attributes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attribute_options"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attribute_definitions"`);
  }
}
