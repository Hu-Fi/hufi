import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';

import {
  CampaignType,
  type LiquidityCampaignManifest,
  type VolumeCampaignManifest,
  type CampaignManifestBase,
} from '../types';

export function generateBaseCampaignManifest(): CampaignManifestBase {
  const manifestBase: CampaignManifestBase = {
    type: faker.lorem.word(),
    exchange: generateExchangeName(),
    symbol: faker.lorem.word(),
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };

  return manifestBase;
}

export function generateVolumeCampaignManifest(): VolumeCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const manifest: VolumeCampaignManifest = {
    ...manifestBase,
    type: CampaignType.VOLUME,
    symbol: generateTradingPair(),
    daily_volume_target: faker.number.float(),
  };
  return manifest;
}

export function generateLiquidityCampaignManifest(): LiquidityCampaignManifest {
  const manifestBase = generateBaseCampaignManifest();

  const manifest: LiquidityCampaignManifest = {
    ...manifestBase,
    type: CampaignType.LIQUIDITY,
    symbol: faker.finance.currencyCode(),
    daily_balance_target: faker.number.float(),
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
