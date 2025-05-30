import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropWeb3TransactionTable1748601081982
  implements MigrationInterface
{
  name = 'DropWeb3TransactionTable1748601081982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hufi"."web3-transaction"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hufi"."web3-transaction" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "contract" character varying NOT NULL, "address" character varying NOT NULL, "method" character varying NOT NULL, "data" json NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_92185dcb091487c3a7507cc60ef" PRIMARY KEY ("id"))`,
    );
  }
}
