import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResultsCutoffDate1764252604985 implements MigrationInterface {
  name = 'AddResultsCutoffDate1764252604985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "results_cutoff_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "results_cutoff_at"`,
    );
  }
}
