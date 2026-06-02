import { EscrowUtils } from '@human-protocol/sdk';
import Decimal from 'decimal.js';
import { MigrationInterface, QueryRunner } from 'typeorm';

type Campaign = {
  id: string;
  chain_id: number;
  address: string;
  fund_amount: string;
  fund_token_decimals: number;
};

async function getCampaignFundAmountNet(campaign: Campaign): Promise<string> {
  const escrow = await EscrowUtils.getEscrow(
    campaign.chain_id,
    campaign.address,
  );
  if (!escrow) {
    throw new Error(`Escrow not found for campaign: ${campaign.id}`);
  }

  const oraclesFeePercent =
    escrow.exchangeOracleFee! +
    escrow.recordingOracleFee! +
    escrow.reputationOracleFee!;
  const netFundsPercent = 100 - oraclesFeePercent;

  const fundAmountNet = Decimal(campaign.fund_amount)
    .mul(netFundsPercent)
    .div(100);

  return fundAmountNet
    .toDecimalPlaces(campaign.fund_token_decimals, Decimal.ROUND_DOWN)
    .toString();
}

export class AddFundAmountNet1780412549394 implements MigrationInterface {
  name = 'AddFundAmountNet1780412549394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ADD "fund_amount_net" numeric(30,18)`,
    );

    while (true) {
      const campaigns = await queryRunner.query(`
        SELECT "id", "chain_id", "address", "fund_amount", "fund_token_decimals"
        FROM "hu_fi"."campaigns"
        WHERE "fund_amount_net" IS NULL LIMIT 50
      `);
      if (campaigns.length === 0) {
        break;
      }

      for (const campaign of campaigns) {
        const fundAmountNet = await getCampaignFundAmountNet(
          campaign as Campaign,
        );
        await queryRunner.query(`
          UPDATE "hu_fi"."campaigns"
          SET "fund_amount_net" = '${fundAmountNet}'
          WHERE "id" = '${campaign.id}';
        `);
      }
    }

    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" ALTER COLUMN "fund_amount_net" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hu_fi"."campaigns" DROP COLUMN "fund_amount_net"`,
    );
  }
}
