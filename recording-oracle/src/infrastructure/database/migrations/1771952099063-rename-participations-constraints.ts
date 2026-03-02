import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameParticipationsConstraints1771952099063 implements MigrationInterface {
  name = 'RenameParticipationsConstraints1771952099063';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" DROP CONSTRAINT "FK_4deae32968a6a500078abf381a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" DROP CONSTRAINT "FK_b6df5fbef2c175d44d78139a059"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" ADD CONSTRAINT "FK_db064f688ab0c9d3d29ff65dcd0" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" ADD CONSTRAINT "FK_19ff58af8e55f10fb937f237cc4" FOREIGN KEY ("campaign_id") REFERENCES "hu_fi"."campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" DROP CONSTRAINT "FK_19ff58af8e55f10fb937f237cc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" DROP CONSTRAINT "FK_db064f688ab0c9d3d29ff65dcd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" ADD CONSTRAINT "FK_b6df5fbef2c175d44d78139a059" FOREIGN KEY ("campaign_id") REFERENCES "hu_fi"."campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."participations" ADD CONSTRAINT "FK_4deae32968a6a500078abf381a1" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
