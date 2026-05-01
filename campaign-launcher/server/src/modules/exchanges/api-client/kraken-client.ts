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
      if (assetInfo.status !== 'enabled') {
        continue;
      }

      /**
       * https://support.kraken.com/articles/360039879471-what-is-asset-s-and-asset-m-?
       * Technically it's possible to have "." in crypto symbol, but for simplicity
       * filter out all assets with "." to exlcude Kraken internal assets for "Migration".
       */
      if (assetSymbol.indexOf('.') > -1) {
        continue;
      }

      updatedAssets.push(assetSymbol);
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
    for (const [_assetPair, assetPairInfo] of Object.entries(data.result)) {
      /**
       * Assert pair name itself is in BASEQUOTE format and in order to put "/"
       * we have to map base and quote assets correctly (e.g. XXDG -> XDG, ZUSD -> USD).
       * To simplify this - rely on wsname field which is in BASE/QUOTE format
       * and contains (presumably) already mapped asset names.
       */
      if (assetPairInfo.status === 'online' && assetPairInfo.wsname) {
        updatedTradeableAssetPairs.push(assetPairInfo.wsname);
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
