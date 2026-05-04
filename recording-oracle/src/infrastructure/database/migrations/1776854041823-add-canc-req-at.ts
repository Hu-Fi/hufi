import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancReqAt1776854041823 implements MigrationInterface {
  name = 'AddCancReqAt1776854041823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "cancellation_requested_at" TIMESTAMP WITH TIME ZONE`,
    );
    /**
     * There might be some old campaigns that were just cancelled w/o cancellation request.
     * We can detect those and update via script or manually.
     */
    await queryRunner.query(`
        UPDATE "hu_fi"."campaigns"
        SET "cancellation_requested_at" = "results_cutoff_at"
        WHERE "status" IN ('cancelled', 'pending_cancellation')
            AND "cancellation_requested_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "cancellation_requested_at"`,
    );
  }
}
