import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillResultsCutoffDate1765382186417 implements MigrationInterface {
  name = 'BackfillResultsCutoffDate1765382186417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE "hu_fi"."campaigns"
        SET "results_cutoff_at" = "end_date"
        WHERE "status" = 'completed' AND "results_cutoff_at" IS NULL
    `);
  }

  public async down(): Promise<void> {
    // one-way backfill
  }
}
