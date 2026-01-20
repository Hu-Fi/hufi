import { ExchangeType } from '../constants';

export type ExchangeInfo = {
  name: string;
  displayName: string;
  url: string;
  logo: string;
  type: ExchangeType;
};

export interface ExchangeApiClient {
  readonly exchangeName: string;

  get info(): ExchangeInfo;

  get marketsLoaded(): boolean;

  loadMarkets(): Promise<void>;

  getTradingPairs(): string[];

  getCurrencies(): string[];
}
