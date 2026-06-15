/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */

declare module 'ccxt' {
  type MarketInfo = {
    type: string | undefined;
    symbol: string;
    [x: string]: unknown;
  };

  export interface Exchange {
    setSandboxMode(enabled: boolean): void;
    isSandboxModeEnabled: boolean;
    loadMarkets(reload = false): Promise<Record<string, unknown>>;
    markets: Record<string, MarketInfo>;
    /**
     * 'undefined' until successfull call of 'loadMarkets'
     */
    symbols?: string[];
    currencies?: Record<string, Record<string, unknown>>;
    name: string;
    urls: {
      www: string;
      logo: string;
    };
    has: Record<string, boolean | undefined>;
    setMarketsFromExchange(sourceExchange: unknown): void;
  }

  const ccxt: {
    version: string;
    exchanges: string[];
    NetworkError: ErrorConstructor;
    [x: string]: new (options?: Record<string, unknown>) => Exchange;
  };
  export = ccxt;
}
