/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */

declare module 'ccxt' {
  export interface Exchange {
    setSandboxMode(enabled: boolean): void;
    checkRequiredCredentials(throwError?: boolean): boolean;
    fetchBalance(): Promise<unknown>;
  }

  const ccxt: {
    version: string;
    exchanges: string[];
    NetworkError: ErrorConstructor;
    [x: string]: new (options: { apiKey: string; secret: string }) => Exchange;
  };
  export = ccxt;
}
