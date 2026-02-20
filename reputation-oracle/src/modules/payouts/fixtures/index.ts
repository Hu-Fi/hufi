import { faker } from '@faker-js/faker';
import { EscrowStatus, type IEscrow } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import { generateTestnetChainId } from '@/modules/web3/fixtures';

import {
  CampaignManifest,
  CampaignType,
  CampaignWithResults,
  CompetitiveCampaignManifest,
  HoldingCampaignManifest,
  IntermediateResult,
  IntermediateResultsData,
  MarketMakingCampaignManifest,
  ParticipantOutcome,
  ThresholdCampaignManifest,
} from '../types';

function generateValidSymbol(): string {
  return faker.string.alphanumeric({
    casing: 'upper',
    length: faker.number.int({ min: 3, max: 10 }),
  });
}

function generateValidPair(): string {
  return `${generateValidSymbol()}/${generateValidSymbol()}`;
}

export function generateManifest(
  type: CampaignType = faker.helpers.arrayElement(
    Object.values(CampaignType),
  ) as CampaignType,
): CampaignManifest {
  const baseManifest = {
    type,
    exchange: faker.lorem.slug(),
    start_date: faker.date.past().toISOString(),
    end_date: faker.date.soon().toISOString(),
  };

  switch (type) {
    case CampaignType.COMPETITIVE_MARKET_MAKING: {
      const manifest: CompetitiveCampaignManifest = {
        ...baseManifest,
        type,
        pair: generateValidPair(),
        rewards_distribution: [50, 30, 20],
      };
      return manifest;
    }
    case CampaignType.HOLDING: {
      const manifest: HoldingCampaignManifest = {
        ...baseManifest,
        type,
        symbol: generateValidSymbol(),
        daily_balance_target: faker.number.float({ min: 1 }),
      };
      return manifest;
    }
    case CampaignType.THRESHOLD: {
      const manifest: ThresholdCampaignManifest = {
        ...baseManifest,
        type,
        symbol: generateValidSymbol(),
        minimum_balance_target: faker.number.float({ min: 1 }),
      };
      return manifest;
    }
    case CampaignType.MARKET_MAKING:
    default: {
      const manifest: MarketMakingCampaignManifest = {
        ...baseManifest,
        type: CampaignType.MARKET_MAKING,
        pair: generateValidPair(),
        daily_volume_target: faker.number.float({ min: 1 }),
      };
      return manifest;
    }
  }
}

export function generateEscrow(): IEscrow {
  const escrowAddress = faker.finance.ethereumAddress();
  const totalFundedAmount = faker.number.bigInt({ min: 1 });

  const escrow: IEscrow = {
    id: escrowAddress,
    chainId: generateTestnetChainId(),
    address: escrowAddress,
    status: EscrowStatus[EscrowStatus.Pending],
    launcher: faker.finance.ethereumAddress(),
    manifest: JSON.stringify(generateManifest()),
    manifestHash: faker.string.hexadecimal(),
    totalFundedAmount: totalFundedAmount,
    balance: totalFundedAmount,
    amountPaid: 0n,
    factoryAddress: faker.finance.ethereumAddress(),
    token: faker.finance.ethereumAddress(),
    createdAt: faker.date.recent().valueOf(),
    count: faker.number.int({ min: 1, max: 42 }),
    intermediateResultsUrl: faker.internet.url(),
    intermediateResultsHash: faker.string.hexadecimal(),
    finalResultsUrl: null,
    finalResultsHash: null,
    jobRequesterId: faker.string.uuid(),
    exchangeOracle: faker.finance.ethereumAddress(),
    recordingOracle: faker.finance.ethereumAddress(),
    reputationOracle: faker.finance.ethereumAddress(),
    exchangeOracleFee: faker.number.int({ min: 1, max: 50 }),
    recordingOracleFee: faker.number.int({ min: 1, max: 50 }),
    reputationOracleFee: faker.number.int({ min: 1, max: 50 }),
  };

  return escrow;
}

export function generateParticipantOutcome(
  overrides: Partial<ParticipantOutcome> = {},
): ParticipantOutcome {
  const outcome: ParticipantOutcome = {
    address: ethers.getAddress(faker.finance.ethereumAddress()),
    score: faker.number.float(),
  };

  Object.assign(outcome, overrides);

  return outcome;
}

/**
 * Generates intermediate result in a converted format, i.e.
 * what is received after validation
 */
export function generateIntermediateResult(): IntermediateResult {
  const reservedFunds = faker.number.float({
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  });
  const intermediateResult = {
    from: faker.date.recent(),
    to: faker.date.soon(),
    reserved_funds: faker.helpers.arrayElement([
      reservedFunds,
      reservedFunds.toString(),
    ]),
    participants_outcomes_batches: [],
  };

  return intermediateResult;
}

/**
 * Generates intermediate result in raw format that corresponds to schema,
 * not one that is a conversion result after validation
 */
export function generateRawIntermediateResult() {
  const intermediateResult = generateIntermediateResult();

  return {
    ...intermediateResult,
    from: intermediateResult.from.toISOString(),
    to: intermediateResult.to.toISOString(),
  };
}

export function generateIntermediateResultsData(): IntermediateResultsData {
  const data: IntermediateResultsData = {
    chain_id: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    exchange: faker.lorem.slug(),
    results: [],
  };

  return data;
}

export function generateCampaign(): CampaignWithResults {
  const data = {
    chainId: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    status: EscrowStatus[EscrowStatus.Pending],
    manifest: JSON.stringify(generateManifest()),
    manifestHash: faker.string.hexadecimal(),
    intermediateResultsUrl: faker.internet.url(),
    intermediateResultsHash: faker.string.hexadecimal(),
    launcher: faker.finance.ethereumAddress(),
    fundTokenAddress: faker.finance.ethereumAddress(),
    fundTokenDecimals: faker.helpers.arrayElement([6, 18]),
    fundAmount: faker.number.int({ min: 1 }),
  };

  return data;
}
