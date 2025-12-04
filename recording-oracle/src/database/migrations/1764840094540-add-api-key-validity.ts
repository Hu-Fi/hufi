import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyValidity1764840094540 implements MigrationInterface {
  name = 'AddApiKeyValidity1764840094540';

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
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "validation_error" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "validation_error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "is_valid"`,
    );
  }
}
