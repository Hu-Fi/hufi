jest.mock('@/logger');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';
import * as ccxt from 'ccxt';

import * as controlFlow from '@/common/utils/control-flow';
import { generateCcxtTrade } from '@/modules/exchanges/api-client/ccxt/fixtures';

import { HYPERLIQUID_TRADES_PAGE_LIMIT } from './constants';
import { HyperliquidClient } from './hyperliquid-client';
import { generateTradingPair } from '../../fixtures';
import * as ccxtClientUtils from '../ccxt/utils';

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
          userEvmAddress: faker.finance.ethereumAddress(),
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
      userEvmAddress: faker.finance.ethereumAddress(),
    });

    expect(client.checkRequiredCredentials()).toBe(true);
  });

  it.each([true, false, undefined])(
    'should create instance with sandbox mode [%#]',
    (sandboxParam) => {
      const client = new HyperliquidClient({
        userId: faker.string.uuid(),
        userEvmAddress: faker.finance.ethereumAddress(),
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
    const symbol = generateTradingPair();
    const since = faker.date.recent().valueOf();

    const mockedTrades = Array.from({ length: 6 }, (_el, index) =>
      generateCcxtTrade({ symbol, timestamp: since + index }),
    );
    /**
     * To simulate same-ms trades overlap on pages of size 3
     */
    mockedTrades[2].timestamp = mockedTrades[3].timestamp;

    mockedExchange.fetchMyTrades.mockImplementation(
      async (_symbol, since: number, _limit, _params: { until: number }) => {
        return mockedTrades
          .filter((t) => t.timestamp >= since && t.timestamp <= _params.until)
          .slice(0, 3);
      },
    );

    const until = mockedTrades.at(-1)!.timestamp + 1;
    const userEvmAddress = faker.finance.ethereumAddress();

    const client = new HyperliquidClient({
      userId: faker.string.uuid(),
      userEvmAddress,
    });

    const pages = await controlFlow.consumeIterator(
      client.fetchMyTrades(symbol, since, until),
    );

    expect(mockedExchange.loadMarkets).toHaveBeenCalledTimes(0);

    const expectedParams = {
      user: userEvmAddress,
      until: until - 1,
    };
    expect(mockedExchange.fetchMyTrades).toHaveBeenCalledTimes(4);
    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      1,
      symbol,
      since,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      expectedParams,
    );
    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      2,
      symbol,
      mockedTrades[2].timestamp,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      expectedParams,
    );
    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      3,
      symbol,
      mockedTrades[4].timestamp,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      expectedParams,
    );
    expect(mockedExchange.fetchMyTrades).toHaveBeenNthCalledWith(
      4,
      symbol,
      mockedTrades[5].timestamp,
      HYPERLIQUID_TRADES_PAGE_LIMIT,
      expectedParams,
    );

    expect(pages.length).toBe(3);
    expect(pages[0]).toEqual(
      mockedTrades.slice(0, 3).map(ccxtClientUtils.mapCcxtTrade),
    );
    expect(pages[1]).toEqual(
      mockedTrades.slice(3, 5).map(ccxtClientUtils.mapCcxtTrade),
    );
    expect(pages[2]).toEqual([ccxtClientUtils.mapCcxtTrade(mockedTrades[5])]);
  });
});
