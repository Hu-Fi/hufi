import { MigrationInterface, QueryRunner } from 'typeorm';

export class ToCancelCampaignStatus1760541560473 implements MigrationInterface {
  name = 'ToCancelCampaignStatus1760541560473';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hu_fi"."campaigns_status_enum" RENAME TO "campaigns_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_status_enum" AS ENUM('active', 'to_cancel', 'pending_cancellation', 'cancelled', 'pending_completion', 'completed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "status" TYPE "hu_fi"."campaigns_status_enum" USING "status"::"text"::"hu_fi"."campaigns_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_status_enum_old" AS ENUM('active', 'pending_cancellation', 'cancelled', 'pending_completion', 'completed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "status" TYPE "hu_fi"."campaigns_status_enum_old" USING "status"::"text"::"hu_fi"."campaigns_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hu_fi"."campaigns_status_enum_old" RENAME TO "campaigns_status_enum"`,
    );
  }
}
