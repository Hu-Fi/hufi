import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignTokenDecimals1757071524526
  implements MigrationInterface
{
  name = 'AddCampaignTokenDecimals1757071524526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "fund_token" = 'USDT0'
      WHERE "fund_token" = 'USDT'
    `);

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_token_decimals" integer`,
    );

    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "fund_token_decimals" = 18
      WHERE "fund_token" = 'HMT'
    `);

    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "fund_token_decimals" = 6
      WHERE "fund_token" IN ('USDT0', 'USDC')
    `);

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "fund_token_decimals" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_token_decimals"`,
    );
  }
}
