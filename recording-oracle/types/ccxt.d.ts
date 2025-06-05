declare module 'ccxt' {
  const ccxt: {
    exchanges: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
  };
  export default ccxt;
}
