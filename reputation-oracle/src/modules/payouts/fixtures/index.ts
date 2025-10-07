import { faker } from '@faker-js/faker';
import { EscrowStatus, IEscrow } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import { generateTestnetChainId } from '@/modules/web3/fixtures';

import {
  CampaignWithResults,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from '../types';

function generateManifest() {
  const manifest = {
    exchange: faker.lorem.slug(),
    start_date: faker.date.past().toISOString(),
    end_date: faker.date.soon().toISOString(),
  };

  return manifest;
}

export function generateEscrow(): IEscrow {
  const escrowAddress = faker.finance.ethereumAddress();
  const totalFundedAmount = faker.number.int({ min: 1 });

  const escrow: IEscrow = {
    id: escrowAddress,
    chainId: generateTestnetChainId(),
    address: escrowAddress,
    status: EscrowStatus[EscrowStatus.Pending],
    manifest: JSON.stringify(generateManifest()),
    manifestHash: faker.string.hexadecimal(),
    totalFundedAmount: totalFundedAmount.toString(),
    balance: totalFundedAmount.toString(),
    amountPaid: '0',
    factoryAddress: faker.finance.ethereumAddress(),
    launcher: faker.finance.ethereumAddress(),
    token: faker.finance.ethereumAddress(),
    createdAt: Math.round(faker.date.recent().valueOf() / 1000).toString(),
    count: faker.number.int({ min: 1, max: 42 }).toString(),
    intermediateResultsUrl: faker.internet.url(),
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

export function generateIntermediateResult(): IntermediateResult {
  const intermediateResult = {
    from: faker.date.recent(),
    to: faker.date.soon(),
    reserved_funds: faker.number.int(),
    participants_outcomes_batches: [],
  };

  return intermediateResult;
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
    manifest: JSON.stringify(generateManifest()),
    manifestHash: faker.string.hexadecimal(),
    intermediateResultsUrl: faker.internet.url(),
    launcher: faker.finance.ethereumAddress(),
    fundTokenAddress: faker.finance.ethereumAddress(),
    fundTokenDecimals: faker.helpers.arrayElement([6, 18]),
    fundAmount: faker.number.int({ min: 1 }),
  };

  return data;
}
