import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';

import { generateCcxtTrade } from '../fixtures';
import {
  type GatePaginationParams,
  getPaginationInput,
  handlePaginationResponse,
  UNTIL_PARAM_SYMBOL,
} from './gate';

const mockedCcxtClient = createMock<Exchange>();

describe('gate pagination helpers', () => {
  describe('getPaginationInput', () => {
    let since: number;
    let until: number;

    beforeEach(() => {
      since = faker.date.past().getTime();
      until = faker.date.soon({ refDate: since }).getTime();
    });

    it('should return correct params for first page', () => {
      const result = getPaginationInput(since, until);

      expect(result).toEqual({
        since,
        params: {
          to: Math.ceil(until / 1000),
          page: 1,
          [UNTIL_PARAM_SYMBOL]: until,
        },
        limit: 250,
      });
    });

    it('should use provided nextPageToken as page', () => {
      const nextPageToken = faker.number.int({ min: 2, max: 100 });
      const result = getPaginationInput(since, until, nextPageToken);

      expect(result).toEqual({
        since,
        params: {
          to: Math.ceil(until / 1000),
          page: nextPageToken,
          [UNTIL_PARAM_SYMBOL]: until,
        },
        limit: 250,
      });
    });
  });

  describe('handlePaginationResponse', () => {
    let paginationParams: GatePaginationParams;

    beforeAll(() => {
      const until = faker.date.future().getTime();
      paginationParams = {
        to: Math.ceil(until / 1000),
        page: -1,
        [UNTIL_PARAM_SYMBOL]: until,
      };
    });

    it('should increment page if lastPage less than limit', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      paginationParams.page = faker.number.int({ min: 1, max: 400 });

      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toBe(paginationParams.page + 1);
    });

    it('should not return nextPageToken if lastPage equals limit', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      paginationParams.page = 401;

      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toBeUndefined();
    });

    it('should not return nextPageToken if lastPage is bigger than limit', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      paginationParams.page = faker.number.int({ min: 402 });

      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toBeUndefined();
    });

    it('should filter out trades with timestamp greater than or equal to until', () => {
      const until = faker.date.past().getTime();

      paginationParams[UNTIL_PARAM_SYMBOL] = until;

      const tradeBeforeUntil = generateCcxtTrade({
        timestamp: until - 1000,
      });
      const tradeAtUntil = generateCcxtTrade({
        timestamp: until,
      });
      const tradeAfterUntil = generateCcxtTrade({
        timestamp: until + 1000,
      });

      const result = handlePaginationResponse({
        trades: [tradeBeforeUntil, tradeAtUntil, tradeAfterUntil],
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toEqual([tradeBeforeUntil]);
    });
  });
});
