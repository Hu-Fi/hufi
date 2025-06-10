/**
 * Due to the project configuration and ccxt library internals
 * it resolves to commonjs module version (ccxt/dist/ccxt.cjs)
 * and under the hood "import * as ccxt from 'ccxt'" works as
 * "const ccxt = require('ccxt')", so we reflect it here as well.
 */
declare module 'ccxt' {
  const ccxt: {
    exchanges: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
  };
  export = ccxt;
}
