import { MigrationInterface, QueryRunner } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';

export class InitialSetup1748865118682 implements MigrationInterface {
  name = 'InitialSetup1748865118682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(DATABASE_SCHEMA_NAME, true);

    await queryRunner.query(
      `CREATE TABLE "hu_fi"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evm_address" character varying(42) NOT NULL, "nonce" character varying(32) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6009c050ae797d7e13ba0b0759" ON "hu_fi"."users" ("evm_address") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "hu_fi"."refresh_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_3ddc983c5f7bcf132fd8732c3f"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_6009c050ae797d7e13ba0b0759"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."users"`);

    await queryRunner.dropSchema(DATABASE_SCHEMA_NAME);
  }
}
