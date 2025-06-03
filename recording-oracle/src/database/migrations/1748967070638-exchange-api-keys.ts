import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExchangeApiKeys1748967070638 implements MigrationInterface {
  name = 'ExchangeApiKeys1748967070638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."exchange_api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "exchange_name" character varying(20) NOT NULL, "api_key" character varying(200) NOT NULL, "secret_key" character varying(200) NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3751a8a0ef5354b32b06ea43983" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8dcd9d18790ca62ebf1fb40cd3" ON "hu_fi"."exchange_api_keys" ("user_id", "exchange_name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD CONSTRAINT "FK_96ee74195b058a1b55afc49f673" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP CONSTRAINT "FK_96ee74195b058a1b55afc49f673"`,
    );
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_8dcd9d18790ca62ebf1fb40cd3"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."exchange_api_keys"`);
  }
}
