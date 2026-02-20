import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchanges/fixtures';

import {
  CampaignManifest,
  CampaignType,
  type CampaignManifestBase,
  type CompetitiveMarketMakingCampaignManifest,
  type HoldingCampaignManifest,
  type MarketMakingCampaignManifest,
  type ThresholdCampaignManifest,
} from '../types';

export function generateBaseCampaignManifest(): CampaignManifestBase {
  const manifestBase: CampaignManifestBase = {
    type: faker.string.sample(),
    exchange: generateExchangeName(),
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };

  return manifestBase;
}

export function generateMarketMakingCampaignManifest(): MarketMakingCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const manifest: MarketMakingCampaignManifest = {
    ...manifestBase,
    type: CampaignType.MARKET_MAKING,
    pair: generateTradingPair(),
    daily_volume_target: faker.number.float(),
  };
  return manifest;
}

export function generateHoldingCampaignManifest(): HoldingCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const manifest: HoldingCampaignManifest = {
    ...manifestBase,
    type: CampaignType.HOLDING,
    symbol: faker.finance.currencyCode(),
    daily_balance_target: faker.number.float(),
  };
  return manifest;
}

export function generateCompetitiveMarketMakingCampaignManifest(): CompetitiveMarketMakingCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const nRewards = faker.number.int({ min: 1, max: 5 });
  const rewardsDistribution: number[] = [];
  let remaining = 100;
  for (let i = 0; i < nRewards; i += 1) {
    const slotsLeft = nRewards - i;
    const maxForCurrent = remaining - (slotsLeft - 1);
    const current = faker.number.int({ min: 1, max: maxForCurrent });
    rewardsDistribution.push(current);
    remaining -= current;
  }

  const manifest: CompetitiveMarketMakingCampaignManifest = {
    ...manifestBase,
    type: CampaignType.COMPETITIVE_MARKET_MAKING,
    pair: generateTradingPair(),
    rewards_distribution: rewardsDistribution,
  };

  return manifest;
}

export function generateThresholdampaignManifest(): ThresholdCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const manifest: ThresholdCampaignManifest = {
    ...manifestBase,
    type: CampaignType.THRESHOLD,
    symbol: faker.finance.currencyCode(),
    minimum_balance_target: faker.number.float(),
  };
  return manifest;
}

export function generateManifestResponse() {
  const manifest = generateBaseCampaignManifest();

  return {
    ...manifest,
    start_date: manifest.start_date.toISOString(),
    end_date: manifest.end_date.toISOString(),
  };
}

export function generateCampaignManifest(): CampaignManifest {
  const generatorFn = faker.helpers.arrayElement([
    generateMarketMakingCampaignManifest,
    generateCompetitiveMarketMakingCampaignManifest,
    generateHoldingCampaignManifest,
    generateThresholdampaignManifest,
  ]);

  return generatorFn();
}
