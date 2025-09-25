import { MigrationInterface, QueryRunner } from 'typeorm';

export class AbstractCampaignType1758725472133 implements MigrationInterface {
  name = 'AbstractCampaignType1758725472133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "pair"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "daily_volume_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "symbol" character varying(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_token_decimals" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "details" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_type_enum" AS ENUM('LIQUIDITY', 'VOLUME')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "type" "hu_fi"."campaigns_type_enum" NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "type"`,
    );
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "type" character varying(40) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "details"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_token_decimals"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "symbol"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "daily_volume_target" numeric(20,8) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "pair" character varying(20) NOT NULL`,
    );
  }
}
