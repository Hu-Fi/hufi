import { MigrationInterface, QueryRunner } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

export class InitialSetup1750074898503 implements MigrationInterface {
  name = 'InitialSetup1750074898503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(DATABASE_SCHEMA_NAME, true);

    await queryRunner.query(
      `CREATE TABLE "hu_fi"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evm_address" character varying(42) NOT NULL, "nonce" character varying(32) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b" UNIQUE ("evm_address"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."exchange_api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "exchange_name" character varying(20) NOT NULL, "api_key" character varying(1000) NOT NULL, "secret_key" character varying(10000) NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3751a8a0ef5354b32b06ea43983" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8dcd9d18790ca62ebf1fb40cd3" ON "hu_fi"."exchange_api_keys" ("user_id", "exchange_name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hu_fi"."campaigns_status_enum" AS ENUM('active', 'pending_cancellation', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chain_id" integer NOT NULL, "address" character varying(42) NOT NULL, "exchange_name" character varying(20) NOT NULL, "pair" character varying(20) NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hu_fi"."campaigns_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0130ea9fe1114c6f88f6ed6315" ON "hu_fi"."campaigns" ("chain_id", "address") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_3ddc983c5f7bcf132fd8732c3f" UNIQUE ("user_id"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."user_campaigns" ("user_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "exchange_api_key_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8ccc7f91e6aa94ef3e1c672f000" PRIMARY KEY ("user_id", "campaign_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_campaigns_campaign_id" ON "hu_fi"."user_campaigns" ("campaign_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" ADD CONSTRAINT "FK_96ee74195b058a1b55afc49f673" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" ADD CONSTRAINT "FK_4deae32968a6a500078abf381a1" FOREIGN KEY ("user_id") REFERENCES "hu_fi"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" ADD CONSTRAINT "FK_b6df5fbef2c175d44d78139a059" FOREIGN KEY ("campaign_id") REFERENCES "hu_fi"."campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" ADD CONSTRAINT "FK_9a1811aa669af54d7809c049525" FOREIGN KEY ("exchange_api_key_id") REFERENCES "hu_fi"."exchange_api_keys"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" DROP CONSTRAINT "FK_9a1811aa669af54d7809c049525"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" DROP CONSTRAINT "FK_b6df5fbef2c175d44d78139a059"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."user_campaigns" DROP CONSTRAINT "FK_4deae32968a6a500078abf381a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."exchange_api_keys" DROP CONSTRAINT "FK_96ee74195b058a1b55afc49f673"`,
    );
    await queryRunner.query(
      `DROP INDEX "hu_fi"."idx_users_campaigns_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."user_campaigns"`);
    await queryRunner.query(`DROP TABLE "hu_fi"."refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_0130ea9fe1114c6f88f6ed6315"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."campaigns"`);
    await queryRunner.query(`DROP TYPE "hu_fi"."campaigns_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_8dcd9d18790ca62ebf1fb40cd3"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."exchange_api_keys"`);
    await queryRunner.query(`DROP TABLE "hu_fi"."users"`);

    await queryRunner.dropSchema(DATABASE_SCHEMA_NAME);
  }
}
