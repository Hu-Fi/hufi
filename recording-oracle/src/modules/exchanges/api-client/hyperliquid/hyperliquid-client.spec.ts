jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';
import * as ccxt from 'ccxt';

import * as controlFlow from '@/common/utils/control-flow';

import { HYPERLIQUID_TRADES_PAGE_LIMIT } from './constants';
import {
  generateHyperliquidCcxtTrade,
  generateHyperliquidWalletAddress,
} from './fixtures';
import { HyperliquidClient } from './hyperliquid-client';

const mockedCcxt = jest.mocked(ccxt);
const mockedExchange = createMock<Exchange>();

describe('HyperliquidClient', () => {
  beforeEach(() => {
    mockedCcxt.hyperliquid.mockReturnValue(mockedExchange);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw when userId is missing', () => {
    expect(
      () =>
        new HyperliquidClient({
          userId: '',
          userEvmAddress: generateHyperliquidWalletAddress(),
        }),
    ).toThrow('userId is missing');
  });

  it('should throw when userEvmAddress is missing', () => {
    expect(
      () =>
        new HyperliquidClient({
          userId: faker.string.uuid(),
          userEvmAddress: '',
        }),
    ).toThrow('userEvmAddress is missing');
  });

  it('should return true on checkRequiredCredentials for valid init', () => {
    const client = new HyperliquidClient({
      userId: faker.string.uuid(),
      userEvmAddress: generateHyperliquidWalletAddress(),
    });

    expect(client.checkRequiredCredentials()).toBe(true);
  });

  it.each([true, false, undefined])(
    'should create instance with sandbox mode [%#]',
    (sandboxParam) => {
      const client = new HyperliquidClient({
        userId: faker.string.uuid(),
        userEvmAddress: generateHyperliquidWalletAddress(),
        sandbox: sandboxParam,
      });

      const expectedSandbox = Boolean(sandboxParam);
      expect(client.sandbox).toBe(expectedSandbox);
      if (expectedSandbox) {
        expect(mockedExchange.setSandboxMode).toHaveBeenCalledTimes(1);
        expect(mockedExchange.setSandboxMode).toHaveBeenCalledWith(true);
      } else {
        expect(mockedExchange.setSandboxMode).toHaveBeenCalledTimes(0);
      }
    },
  );

  it('should fetch and paginate trades using ccxt with wallet params', async () => {
    const userId = faker.string.uuid();
    const userEvmAddress = generateHyperliquidWalletAddress();
    const client = new HyperliquidClient({
      userId,
      userEvmAddress,
    });

    const now = Date.now();
    const since = now - 15_000;
    const until = now - 5_000;

    const symbol = 'HYPE/USDC';
    const t1 = generateHyperliquidCcxtTrade({
      id: 't1',
      timestamp: since + 1000,
      symbol,
      side: 'buy',
      takerOrMaker: 'maker',
      price: 2,
      amount: 100,
      cost: 200,
    });
    const t2 = generateHyperliquidCcxtTrade({
      id: 't2',
      timestamp: since + 2000,
      symbol,
      side: 'sell',
      takerOrMaker: 'taker',
      price: 3,
      amount: 50,
      cost: 150,
    });
    const t3 = generateHyperliquidCcxtTrade({
      id: 't3',
      timestamp: since + 3000,
      symbol,
      side: 'buy',
      takerOrMaker: 'maker',
      price: 4,
      amount: 25,
      cost: 100,
    });

    mockedExchange.fetchMyTrades
      .mockResolvedValueOnce([t1, t2] as never)
      .mockResolvedValueOnce([t3] as never)
      .mockResolvedValueOnce([] as never);

    const batches = await controlFlow.consumeIterator(
      client.fetchMyTrades(symbol, since, until),
    );

    expect(mockedExchange.loadMarkets).toHaveBeenCalledTimes(0);

    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      1,
      symbol,
      since,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      {
        user: userEvmAddress,
        until,
      },
    );
    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      2,
      symbol,
      t2.timestamp + 1,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      {
        user: userEvmAddress,
        until,
      },
    );

    expect(batches).toHaveLength(2);
    expect(batches[0][0]).toEqual(
      expect.objectContaining({
        id: t1.id,
        symbol: t1.symbol,
        side: t1.side,
        takerOrMaker: t1.takerOrMaker,
      }),
    );
  });
});
