import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayloadToWebhookIncoming1746521639060
  implements MigrationInterface
{
  name = 'AddPayloadToWebhookIncoming1746521639060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hufi"."webhook_incoming"
      ADD COLUMN "payload" varchar NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_webhook_chain_escrow_payload"
      ON "hufi"."webhook_incoming" ("chain_id", "escrow_address", "payload");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "hufi"."IDX_webhook_chain_escrow_payload";
    `);

    await queryRunner.query(`
      ALTER TABLE "hufi"."webhook_incoming"
      DROP COLUMN "payload";
    `);
  }
}
