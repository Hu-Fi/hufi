/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */

declare module 'ccxt' {
  // https://docs.ccxt.com/#/README?id=order-structure
  export type Order = {
    id: string;
    status: 'open' | 'closed' | 'canceled' | 'expired' | 'rejected';
    timestamp: number;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    amount: number;
    filled: number;
    cost: number;
    [x: string]: unknown;
  };

  // https://docs.ccxt.com/#/README?id=trade-structure
  export type Trade = {
    id: string;
    timestamp: number;
    symbol: string;
    order: string;
    side: 'buy' | 'sell';
    takerOrMaker: 'taker' | 'maker';
    price: number;
    amount: number;
    cost: number;
    [x: string]: unknown;
  };

  type TokenBalances = {
    free: number;
    used: number;
    total: number;
  };

  export type AccountBalance = {
    [x: string]: TokenBalances | undefined;
    info?: unknown;
    timestamp?: unknown;
    datetime?: unknown;
  };

  export type AddressStructure = {
    currency: string;
    address: string;
    network?: string | null;
    [x: string]: unknown;
  };

  export type NetworkStructure = {
    id: string;
    network: string;
    name: string;
    active: string;
    deposit: boolean;
    [x: string]: unknown;
  };

  export type CurrencyStructure = {
    id: string;
    code: string;
    name: string;
    active: boolean;
    deposit: true;
    networks: {
      [network: string]: NetworkStructure | undefined;
    };
    [x: string]: unknown;
  };

  export interface Exchange {
    has: Record<string, boolean | undefined>;
    requiredCredentials: {
      apiKey: boolean;
      secret: boolean;
      [extraCredential: string]: boolean;
    };
    setSandboxMode(enabled: boolean): void;
    loadMarkets(reload = false): Promise<void>;
    setMarketsFromExchange(sourceExchange: unknown): void;
    checkRequiredCredentials(throwError?: boolean): boolean;
    fetchBalance(): Promise<AccountBalance>;
    fetchOpenOrders(symbol: string, since: number): Promise<Order[]>;
    fetchMyTrades(
      symbol: string,
      since: number,
      limit?: number,
    ): Promise<Trade[]>;
    fetchDepositAddress(
      symbol: string,
      params?: Record<string, unknown>,
    ): Promise<AddressStructure>;
    fetchCurrencies(): Promise<{
      [currencyCode: string]: CurrencyStructure | undefined;
    }>;
  }

  const ccxt: {
    version: string;
    exchanges: string[];
    BaseError: ErrorConstructor;
    AccountNotEnabled: ErrorConstructor;
    AccountSuspended: ErrorConstructor;
    AuthenticationError: ErrorConstructor;
    BadSymbol: ErrorConstructor;
    InvalidAddress: ErrorConstructor;
    PermissionDenied: ErrorConstructor;
    NetworkError: ErrorConstructor;
    // https://docs.ccxt.com/#/README?id=exchange-properties
    [x: string]: new (options: {
      apiKey?: string;
      secret?: string;
      enableRateLimit?: boolean;
      options?: {
        [x: string]: unknown;
      };
    }) => Exchange;
  };
  export = ccxt;
}
