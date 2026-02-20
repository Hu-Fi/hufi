import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompetitionCampaign1771503073601 implements MigrationInterface {
  name = 'AddCompetitionCampaign1771503073601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hu_fi"."campaigns_type_enum" RENAME TO "campaigns_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_type_enum" AS ENUM('MARKET_MAKING', 'COMPETITIVE_MARKET_MAKING', 'HOLDING', 'THRESHOLD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "type" TYPE "hu_fi"."campaigns_type_enum" USING "type"::"text"::"hu_fi"."campaigns_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_type_enum_old" AS ENUM('MARKET_MAKING', 'HOLDING', 'THRESHOLD')`,
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
