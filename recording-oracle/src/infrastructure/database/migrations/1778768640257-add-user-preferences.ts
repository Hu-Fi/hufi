import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPreferences1778768640257 implements MigrationInterface {
  name = 'AddUserPreferences1778768640257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."user_preferences" ("user_id" uuid NOT NULL, "campaigns_autojoin" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_458057fa75b66e68a275647da2e" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" ADD CONSTRAINT "FK_458057fa75b66e68a275647da2e" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_preferences" DROP CONSTRAINT "FK_458057fa75b66e68a275647da2e"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."user_preferences"`);
  }
}
