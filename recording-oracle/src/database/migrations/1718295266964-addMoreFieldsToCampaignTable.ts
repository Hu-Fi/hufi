import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoreFieldsToCampaignTable1718295266964
  implements MigrationInterface
{
  name = 'AddMoreFieldsToCampaignTable1718295266964';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "exchange_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "start_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "end_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "fund_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "fund_amount" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" ADD "last_synced_at" TIMESTAMP NOT NULL DEFAULT 'NOW()'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "last_synced_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "fund_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "fund_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."campaigns" DROP COLUMN "exchange_name"`,
    );
  }
}
