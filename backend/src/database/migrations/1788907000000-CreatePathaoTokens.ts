import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates `pathao_tokens` — the per-tenant cache for Pathao's OAuth2 access /
 * refresh token pair (PathaoAuthService). One row per tenant; sandbox and
 * production never share a row since the `sandbox` flag is stored alongside
 * and compared on read.
 */
export class CreatePathaoTokens1788907000000 implements MigrationInterface {
  name = 'CreatePathaoTokens1788907000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pathao_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "encryptedTokens" text NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "sandbox" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_pathao_tokens_tenant" UNIQUE ("tenantId"),
        CONSTRAINT "PK_pathao_tokens" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pathao_tokens"`);
  }
}
