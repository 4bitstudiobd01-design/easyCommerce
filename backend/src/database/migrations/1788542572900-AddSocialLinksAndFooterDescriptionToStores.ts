import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialLinksAndFooterDescriptionToStores1788542572900 implements MigrationInterface {
  name = 'AddSocialLinksAndFooterDescriptionToStores1788542572900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "facebookUrl" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "instagramUrl" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "twitterUrl" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "youtubeUrl" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN "footerDescription" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "footerDescription"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "youtubeUrl"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "twitterUrl"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "instagramUrl"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "facebookUrl"`);
  }
}
