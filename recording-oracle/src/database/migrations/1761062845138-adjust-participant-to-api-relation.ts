import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdjustParticipantToApiRelation1761062845138 implements MigrationInterface {
  name = 'AdjustParticipantToApiRelation1761062845138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" DROP CONSTRAINT "FK_9a1811aa669af54d7809c049525"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" DROP COLUMN "exchange_api_key_id"`,
    );
  }

  public async down(): Promise<void> {
    // one-way migration
  }
}
