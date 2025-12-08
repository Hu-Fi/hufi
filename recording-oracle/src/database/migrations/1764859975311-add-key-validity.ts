import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKeyValidity1764859975311 implements MigrationInterface {
  name = 'AddKeyValidity1764859975311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "is_valid" boolean`,
    );
    await queryRunner.query(`
      UPDATE "hu_fi"."exchange_api_keys"
      SET "is_valid" = true
    `);
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ALTER COLUMN "is_valid" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "hu_fi"."exchange_api_keys_missing_permissions_enum" AS ENUM('VIEW_ACCOUNT_BALANCE', 'VIEW_DEPOSIT_ADDRESS', 'VIEW_SPOT_TRADING_HISTORY')`,
    );

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "missing_permissions" "hu_fi"."exchange_api_keys_missing_permissions_enum" array`,
    );
    await queryRunner.query(`
      UPDATE "hu_fi"."exchange_api_keys"
      SET "missing_permissions" = '{}'
    `);
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ALTER COLUMN "missing_permissions" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "missing_permissions"`,
    );
    await queryRunner.query(
      `DROP TYPE "hu_fi"."exchange_api_keys_missing_permissions_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "is_valid"`,
    );
  }
}
