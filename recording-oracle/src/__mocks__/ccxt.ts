const actualCcxt = jest.requireActual<typeof import('ccxt')>('ccxt');

const mockedCcxt = new Proxy<Record<string, unknown>>(
  {
    version: actualCcxt.version,
    exchanges: actualCcxt.exchanges,
    NetworkError: actualCcxt.NetworkError,
  },
  {
    get: (target, prop: string) => {
      if (!(prop in target)) {
        target[prop] = jest.fn();
      }

      return target[prop];
    },
  },
);

module.exports = mockedCcxt;
