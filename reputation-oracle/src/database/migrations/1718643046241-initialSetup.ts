import { MigrationInterface, QueryRunner } from 'typeorm';

import { NS } from '../../common/constants';

export class InitialSetup1718643046241 implements MigrationInterface {
  name = 'InitialSetup1718643046241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);

    await queryRunner.query(
      `CREATE TYPE "hufi"."webhook_incoming_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'PAID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hufi"."webhook_incoming" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "oracle_address" character varying, "escrow_address" character varying NOT NULL, "results_url" character varying, "check_passed" boolean, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hufi"."webhook_incoming_status_enum" NOT NULL, CONSTRAINT "PK_08e16abccb4720323203bf8f7a0" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hufi"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hufi"."webhook_incoming_status_enum"`);

    await queryRunner.dropSchema(NS, true);
  }
}
