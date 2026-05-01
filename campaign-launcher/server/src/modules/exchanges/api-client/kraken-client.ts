import { ExchangeName } from '@/common/constants';

import { BaseExchangeApiClient } from './base-client';

const BASE_API_URL = 'https://api.kraken.com/0/public';

type KrakenAsset = {
  altname: string;
  decimals: number;
  display_decimals: number;
  status: string;
};

type KrakenTradeableAssetPair = {
  altname: string;
  wsname: string;
  aclass_base: string;
  base: string;
  aclass_quote: string;
  quote: string;
  status: string;
};

export class KrakenClient extends BaseExchangeApiClient {
  private assets: string[] = [];
  private tradeableAssetPairs: string[] = [];

  constructor() {
    super(ExchangeName.KRAKEN);
  }

  private async loadAssets(): Promise<void> {
    const response = await fetch(`${BASE_API_URL}/Assets?aclass=currency`);
    const data: { result?: Record<string, KrakenAsset> } =
      await response.json();

    if (!data.result) {
      throw new Error('Failed to load assets from Kraken API');
    }

    const updatedAssets: string[] = [];
    for (const [assetSymbol, assetInfo] of Object.entries(data.result)) {
      if (assetInfo.status === 'enabled') {
        updatedAssets.push(assetSymbol);
      }
    }
    this.assets = updatedAssets;
  }

  private async loadTradeableAssetPairs(): Promise<void> {
    const response = await fetch(
      `${BASE_API_URL}/AssetPairs?aclass_base=currency`,
    );
    const data: {
      result?: Record<string, KrakenTradeableAssetPair>;
    } = await response.json();

    if (!data.result) {
      throw new Error('Failed to load tradeable asset pairs from Kraken API');
    }

    const updatedTradeableAssetPairs: string[] = [];
    for (const [assetPair, assetPairInfo] of Object.entries(data.result)) {
      if (assetPairInfo.status === 'online') {
        let assetPairName: string;
        if (assetPairInfo.wsname) {
          assetPairName = assetPairInfo.wsname;
        } else {
          const quoteAltName = assetPair.slice(assetPairInfo.base.length);
          assetPairName = `${assetPairInfo.base}/${quoteAltName}`;
        }
        updatedTradeableAssetPairs.push(assetPairName);
      }
    }
    this.tradeableAssetPairs = updatedTradeableAssetPairs;
  }

  protected async runLoadMarkets(): Promise<void> {
    await Promise.all([this.loadAssets(), this.loadTradeableAssetPairs()]);
  }

  protected get tradingPairs() {
    return this.tradeableAssetPairs;
  }

  protected get currencies() {
    return this.assets;
  }
}
