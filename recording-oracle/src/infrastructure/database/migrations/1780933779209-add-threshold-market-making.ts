import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThresholdMarketMaking1780933779209 implements MigrationInterface {
  name = 'AddThresholdMarketMaking1780933779209';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hu_fi"."campaigns_type_enum" ADD VALUE 'THRESHOLD_MARKET_MAKING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_type_enum_old" AS ENUM('MARKET_MAKING', 'COMPETITIVE_MARKET_MAKING', 'HOLDING', 'THRESHOLD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "type" TYPE "hu_fi"."campaigns_type_enum_old" USING "type"::"text"::"hu_fi"."campaigns_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hu_fi"."campaigns_type_enum_old" RENAME TO "campaigns_type_enum"`,
    );
  }
}
