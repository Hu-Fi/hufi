import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCampaignDateFieldType1723689218832
  implements MigrationInterface
{
  name = 'UpdateCampaignDateFieldType1723689218832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "start_date" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "end_date" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ALTER COLUMN "last_synced_at" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ALTER COLUMN "last_synced_at" SET DEFAULT '2024-06-17 15:24:42.191907'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "end_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "start_date" date`,
    );
  }
}
