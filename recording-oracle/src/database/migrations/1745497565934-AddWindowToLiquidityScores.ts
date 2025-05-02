import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWindowToLiquidityScores1745497565934
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- 1. Add new columns as nullable
      ALTER TABLE "hufi"."liquidity-scores"
        ADD COLUMN IF NOT EXISTS window_start timestamptz,
        ADD COLUMN IF NOT EXISTS window_end timestamptz;

      -- 2. Back-fill missing values
      UPDATE "hufi"."liquidity-scores"
      SET
        window_start = COALESCE(window_start, NOW()),
        window_end = COALESCE(window_end, NOW())
      WHERE window_start IS NULL OR window_end IS NULL;

      -- 3. Ensure uniqueness by offsetting duplicate timestamps
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY campaign_id, user_id, window_start
                 ORDER BY id
               ) AS dup_nr
        FROM "hufi"."liquidity-scores"
      )
      UPDATE "hufi"."liquidity-scores" ls
      SET window_start = ls.window_start + (ranked.dup_nr - 1) * interval '1 microsecond'
      FROM ranked
      WHERE ls.id = ranked.id AND ranked.dup_nr > 1;

      -- 4. Make the new columns NOT NULL
      ALTER TABLE "hufi"."liquidity-scores"
        ALTER COLUMN window_start SET NOT NULL,
        ALTER COLUMN window_end SET NOT NULL;

      -- 5. Add unique constraint if it doesn't already exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_liquidity_scores_campaign_user_window'
        ) THEN
          ALTER TABLE "hufi"."liquidity-scores"
            ADD CONSTRAINT uq_liquidity_scores_campaign_user_window
            UNIQUE (campaign_id, user_id, window_start);
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hufi"."liquidity-scores"
        DROP CONSTRAINT IF EXISTS uq_liquidity_scores_campaign_user_window;

      ALTER TABLE "hufi"."liquidity-scores"
        ALTER COLUMN window_start DROP NOT NULL,
        ALTER COLUMN window_end DROP NOT NULL;

      ALTER TABLE "hufi"."liquidity-scores"
        DROP COLUMN IF EXISTS window_start,
        DROP COLUMN IF EXISTS window_end;
    `);
  }
}
