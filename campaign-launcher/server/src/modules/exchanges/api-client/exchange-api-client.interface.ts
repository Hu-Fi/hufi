export interface ExchangeApiClient {
  readonly exchangeName: string;

  get marketsLoaded(): boolean;

  loadMarkets(): Promise<void>;

  getTradingPairs(): string[];

  getCurrencies(): string[];
}
