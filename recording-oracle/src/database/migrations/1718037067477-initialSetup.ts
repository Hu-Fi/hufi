import { MigrationInterface, QueryRunner } from 'typeorm';

import { NS } from '../../common/constants';

export class InitialSetup1718037067477 implements MigrationInterface {
  name = 'InitialSetup1718037067477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);

    await queryRunner.query(
      `CREATE TABLE "hufi"."liquidity-scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "score" double precision NOT NULL, "calculated_at" TIMESTAMP NOT NULL, "user_id" uuid, "campaign_id" uuid, CONSTRAINT "PK_5075d97f51d4a5c401c822bbb9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "address" character varying NOT NULL, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0130ea9fe1114c6f88f6ed6315" ON "hufi"."campaigns" ("chain_id", "address") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."exchange-api-keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "exchange_name" character varying NOT NULL, "api_key" character varying NOT NULL, "secret" character varying NOT NULL, "user_id" uuid, CONSTRAINT "PK_8ca42425479da03dd6dfc0986da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hufi"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "evm_address" character varying NOT NULL, "nonce" character varying, "status" "hufi"."users_status_enum" NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hufi"."tokens_type_enum" AS ENUM('REFRESH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "type" "hufi"."tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."user-campaigns" ("users_id" uuid NOT NULL, "campaigns_id" uuid NOT NULL, CONSTRAINT "PK_3cdb4326c84e2afccfac39cf7cb" PRIMARY KEY ("users_id", "campaigns_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ece7b27b152510f4edc659fbd9" ON "hufi"."user-campaigns" ("users_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_790df3f4df34250bee08b795c3" ON "hufi"."user-campaigns" ("campaigns_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ADD CONSTRAINT "FK_b6726d12f2188f2cb82fb31dc26" FOREIGN KEY ("user_id") REFERENCES "hufi"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ADD CONSTRAINT "FK_2ff703afaa0a0c8b1a2acdedd8a" FOREIGN KEY ("campaign_id") REFERENCES "hufi"."campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."exchange-api-keys" ADD CONSTRAINT "FK_39bb3d8ca1a61a47eb621307f92" FOREIGN KEY ("user_id") REFERENCES "hufi"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hufi"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."user-campaigns" ADD CONSTRAINT "FK_ece7b27b152510f4edc659fbd99" FOREIGN KEY ("users_id") REFERENCES "hufi"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."user-campaigns" ADD CONSTRAINT "FK_790df3f4df34250bee08b795c37" FOREIGN KEY ("campaigns_id") REFERENCES "hufi"."campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."user-campaigns" DROP CONSTRAINT "FK_790df3f4df34250bee08b795c37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."user-campaigns" DROP CONSTRAINT "FK_ece7b27b152510f4edc659fbd99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."exchange-api-keys" DROP CONSTRAINT "FK_39bb3d8ca1a61a47eb621307f92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" DROP CONSTRAINT "FK_2ff703afaa0a0c8b1a2acdedd8a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" DROP CONSTRAINT "FK_b6726d12f2188f2cb82fb31dc26"`,
    );
    await queryRunner.query(
      `DROP INDEX "hufi"."IDX_790df3f4df34250bee08b795c3"`,
    );
    await queryRunner.query(
      `DROP INDEX "hufi"."IDX_ece7b27b152510f4edc659fbd9"`,
    );
    await queryRunner.query(`DROP TABLE "hufi"."user-campaigns"`);
    await queryRunner.query(`DROP TABLE "hufi"."tokens"`);
    await queryRunner.query(`DROP TYPE "hufi"."tokens_type_enum"`);
    await queryRunner.query(`DROP TABLE "hufi"."users"`);
    await queryRunner.query(`DROP TYPE "hufi"."users_status_enum"`);
    await queryRunner.query(`DROP TABLE "hufi"."exchange-api-keys"`);
    await queryRunner.query(
      `DROP INDEX "hufi"."IDX_0130ea9fe1114c6f88f6ed6315"`,
    );
    await queryRunner.query(`DROP TABLE "hufi"."campaigns"`);
    await queryRunner.query(`DROP TABLE "hufi"."liquidity-scores"`);
    await queryRunner.dropSchema(NS, true);
  }
}
