export { ExchangesModule } from './exchanges.module';

export {
  ExchangeApiClientFactory,
  ExchangeApiClientError,
  ExchangeApiAccessError,
  type Order,
  type Trade,
  type ExchangeApiClient,
  type ExchangeApiClientInitOptions,
  TakerOrMakerFlag,
  TradingSide,
} from './api-client';

export * from './exchange-api-keys';
