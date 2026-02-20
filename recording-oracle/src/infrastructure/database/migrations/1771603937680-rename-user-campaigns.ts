import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserCampaigns1771603937680 implements MigrationInterface {
  name = 'RenameUserCampaigns1771603937680';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "hu_fi"."user_campaigns" RENAME TO "participations"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "hu_fi"."participations" RENAME TO "user_campaigns"',
    );
  }
}
