/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */

declare module 'ccxt' {
  export interface Exchange {
    loadMarkets(): Promise<Record<string, unknown>>;
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
  }

  const ccxt: {
    version: string;
    exchanges: string[];
    NetworkError: ErrorConstructor;
    [x: string]: new (options?: Record<string, unknown>) => Exchange;
  };
  export = ccxt;
}
