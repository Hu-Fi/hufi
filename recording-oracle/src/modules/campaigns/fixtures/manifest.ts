import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';

import {
  CampaignType,
  type LiquidityCampaignManifest,
  type VolumeCampaignManifest,
  type CampaignManifest,
  type CampaignManifestBase,
} from '../types';

export function generateCampaignManifest(
  type?: string,
): CampaignManifestBase | CampaignManifest {
  const manifestBase: CampaignManifestBase = {
    type: '',
    exchange: generateExchangeName(),
    symbol: '',
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };

  switch (type) {
    case CampaignType.VOLUME: {
      const manifest: VolumeCampaignManifest = {
        ...manifestBase,
        type,
        symbol: generateTradingPair(),
        daily_volume_target: faker.number.float(),
      };
      return manifest;
    }
    case CampaignType.LIQUIDITY: {
      const manifest: LiquidityCampaignManifest = {
        ...manifestBase,
        type,
        symbol: faker.finance.currencyCode(),
        daily_balance_target: faker.number.float(),
      };
      return manifest;
    }
    default:
      manifestBase.type = faker.lorem.word();
      manifestBase.symbol = faker.lorem.word();
      return manifestBase;
  }
}
