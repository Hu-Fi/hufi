import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNotifPrefs1779364030477 implements MigrationInterface {
  name = 'AddUserNotifPrefs1779364030477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" ADD "notifications" jsonb`,
    );
    await queryRunner.query(`
      UPDATE "hu_fi"."user_preferences"
      SET notifications = '{}'::jsonb
      WHERE notifications IS NULL;
    `);
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" ALTER COLUMN "notifications" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" DROP COLUMN "notifications"`,
    );
  }
}
