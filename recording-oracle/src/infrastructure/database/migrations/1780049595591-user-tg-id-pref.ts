import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTgIdPref1780049595591 implements MigrationInterface {
  name = 'UserTgIdPref1780049595591';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" ADD "telegram_user_id" character varying(36)`,
    );
    await queryRunner.query(`
      UPDATE "hu_fi"."user_preferences"
      SET
        telegram_user_id = notifications->>'telegramUserId',
        notifications = notifications - 'telegramUserId'
      WHERE notifications ? 'telegramUserId'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" DROP COLUMN "telegram_user_id"`,
    );
  }
}
