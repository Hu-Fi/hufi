export {
  ExchangeApiClientError,
  ExchangeApiAccessError,
  IncompleteKeySuppliedError,
} from './errors';

export { ExchangeApiClientModule } from './exchange-api-client.module';
export { ExchangeApiClientFactory } from './exchange-api-client-factory';
export type {
  ExchangeApiClient,
  CexApiClientInitOptions,
} from './exchange-api-client.interface';

export {
  type ExchangeExtras,
  type Order,
  type Trade,
  ExchangePermission,
  TakerOrMakerFlag,
  TradingSide,
  type RequiredAccessCheckResult,
} from './types';
