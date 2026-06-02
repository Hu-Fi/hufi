import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFundAmountNet1780412549394 implements MigrationInterface {
  name = 'AddFundAmountNet1780412549394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_amount_net" numeric(30,18)`,
    );
    await queryRunner.query(`
      UPDATE "hu_fi"."campaigns"
      SET "fund_amount_net" = "fund_amount"
      WHERE fund_amount_net IS NULL;
    `);
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "fund_amount_net" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_amount_net"`,
    );
  }
}
