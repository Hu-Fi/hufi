import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignFundAmount1753714960379 implements MigrationInterface {
  name = 'AddCampaignFundAmount1753714960379';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_amount" numeric(30,18) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_token" character varying(20) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_amount"`,
    );
  }
}
