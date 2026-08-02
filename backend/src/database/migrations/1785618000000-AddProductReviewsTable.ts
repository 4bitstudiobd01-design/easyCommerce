import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductReviewsTable1785618000000 implements MigrationInterface {
  name = 'AddProductReviewsTable1785618000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" integer NOT NULL,
        "reviewerName" character varying(255) NOT NULL,
        "reviewerEmail" character varying(255),
        "comment" text NOT NULL,
        "images" jsonb DEFAULT '[]',
        "isVerifiedBuyer" boolean NOT NULL DEFAULT false,
        "isApproved" boolean NOT NULL DEFAULT false,
        "productId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_reviews_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_product_reviews_tenantId" ON "product_reviews" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_reviews_productId" ON "product_reviews" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_reviews_isApproved" ON "product_reviews" ("isApproved")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_product_reviews_isApproved"`);
    await queryRunner.query(`DROP INDEX "IDX_product_reviews_productId"`);
    await queryRunner.query(`DROP INDEX "IDX_product_reviews_tenantId"`);
    await queryRunner.query(`DROP TABLE "product_reviews"`);
  }
}
