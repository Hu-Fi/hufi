import { MigrationInterface, QueryRunner } from 'typeorm';

export class AbstractCampaignType1758902260862 implements MigrationInterface {
  name = 'AbstractCampaignType1758902260862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * One-way migration, no need to revert it
     */
    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "fund_token" = 'USDT0'
      WHERE "fund_token" = 'USDT'
    `);

    // =================== FUND TOKEN DECIMALS START ===================
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
    // =================== FUND TOKEN DECIMALS END ===================

    // =================== CAMPAIGN SYMBOL START ===================
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" RENAME COLUMN "pair" TO "symbol"`,
    );
    // =================== CAMPAIGN SYMBOL END ===================

    // =================== CAMPAIGN TYPE START ===================
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_type_enum" AS ENUM('MARKET_MAKING', 'HOLDING')`,
    );
    await queryRunner.query(`
      ALTER TABLE "hu_fi"."campaigns"
      ALTER COLUMN "type" TYPE "hu_fi"."campaigns_type_enum"
      USING "type"::"hu_fi"."campaigns_type_enum";
    `);
    // =================== CAMPAIGN TYPE END ===================

    // =================== CAMPAIGN DETAILS START ===================
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "details" jsonb`,
    );

    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "details" = jsonb_build_object(
        'dailyVolumeTarget', "daily_volume_target"
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "details" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "daily_volume_target"`,
    );
    // =================== CAMPAIGN DETAILS END ===================
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // =================== FUND TOKEN DECIMALS START ===================
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_token_decimals"`,
    );
    // =================== FUND TOKEN DECIMALS END ===================

    // =================== CAMPAIGN SYMBOL START ===================
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" RENAME COLUMN "symbol" TO "pair"`,
    );
    // =================== CAMPAIGN SYMBOL END ===================

    // =================== CAMPAIGN TYPE START ===================
    await queryRunner.query(`
      ALTER TABLE "hu_fi"."campaigns"
      ALTER COLUMN "type" TYPE character varying(40)
      USING "type"::character varying(40);
    `);
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_type_enum"`);
    // =================== CAMPAIGN TYPE END ===================

    // =================== CAMPAIGN DETAILS START ===================
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "daily_volume_target" numeric(20,8)`,
    );

    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "daily_volume_target" = (details->>'dailyVolumeTarget')::numeric
    `);

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "daily_volume_target" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "details"`,
    );
    // =================== CAMPAIGN DETAILS END ===================
    //--------------------------------------------------------
  }
}
