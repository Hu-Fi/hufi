import { MigrationInterface, QueryRunner } from 'typeorm';

export class EncryptKeyExtras1781796288488 implements MigrationInterface {
  name = 'EncryptKeyExtras1781796288488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "extras"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "extras" character varying(10000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "extras"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "extras" jsonb`,
    );
  }
}
