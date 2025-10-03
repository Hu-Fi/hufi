export { ExchangeModule } from './exchange.module';
export { ExchangeApiClientFactory } from './exchange-api-client-factory';
export { ExchangeApiClientError, ExchangeApiAccessError } from './errors';
export type { Order, Trade } from './types';

export type {
  ExchangeApiClient,
  ExchangeApiClientInitOptions,
} from './exchange-api-client.interface';

export { TakerOrMakerFlag, TradingSide } from './types';
