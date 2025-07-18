import { MigrationInterface, QueryRunner } from 'typeorm';

export class VolumeStats1752851913318 implements MigrationInterface {
  name = 'VolumeStats1752851913318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hu_fi"."volume_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "campaign_address" character varying(42) NOT NULL, "exchange_name" character varying(20) NOT NULL, "volume" numeric(20,2) NOT NULL, "period_start" TIMESTAMP WITH TIME ZONE NOT NULL, "period_end" TIMESTAMP WITH TIME ZONE NOT NULL, "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cb48bf745e9c4fc42bf2d8c567e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7ec2d9f22efc25135dc0e7731d" ON "hu_fi"."volume_stats" ("exchange_name", "campaign_address", "period_start") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hu_fi"."IDX_7ec2d9f22efc25135dc0e7731d"`,
    );
    await queryRunner.query(`DROP TABLE "hu_fi"."volume_stats"`);
  }
}
