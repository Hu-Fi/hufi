import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultDate1746709598183 implements MigrationInterface {
  name = 'AddDefaultDate1746709598183';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ALTER COLUMN "created_at" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ALTER COLUMN "updated_at" SET DEFAULT NOW()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hufi"."liquidity-scores" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
  }
}
