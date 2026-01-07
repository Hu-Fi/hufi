import { Web3Cache } from '../web3-cache';

type MockedWeb3Cache = Omit<Web3Cache, 'redisCacheClient'> & {
  clear: () => void;
};

export default class Web3CacheMock implements MockedWeb3Cache {
  readonly __cache = new Map();

  async getTokenPriceUsd(symbol: string): Promise<number | null> {
    return this.__cache.get(symbol) ?? null;
  }

  async setTokenPriceUsd(symbol: string, tokenPriceUsd: number): Promise<void> {
    this.__cache.set(symbol, tokenPriceUsd);
  }

  clear() {
    this.__cache.clear();
  }
}
