import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyExtras1764602547878 implements MigrationInterface {
  name = 'AddApiKeyExtras1764602547878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD "extras" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP COLUMN "extras"`,
    );
  }
}
