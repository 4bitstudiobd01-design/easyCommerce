import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderNoteEntity1786576305939 implements MigrationInterface {
    name = 'AddOrderNoteEntity1786576305939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "content" text NOT NULL, "isCustomerVisible" boolean NOT NULL DEFAULT false, "createdBy" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_98b207341585da2a0faa9b841ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_notes" ADD CONSTRAINT "FK_22085a1f5dcf10faae9b57afc0a" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_notes" DROP CONSTRAINT "FK_22085a1f5dcf10faae9b57afc0a"`);
        await queryRunner.query(`DROP TABLE "order_notes"`);
    }

}
