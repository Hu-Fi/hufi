import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';
import _ from 'lodash';

import { generateCcxtTrade } from '../fixtures';
import {
  getPaginationInput,
  handlePaginationResponse,
  type MexcNextPageToken,
  type MexcPaginationParams,
} from './mexc';

const mockedCcxtClient = createMock<Exchange>();

describe('mexc pagination helpers', () => {
  describe('getPaginationInput', () => {
    let since: number;
    let until: number;

    beforeEach(() => {
      since = faker.date.past().getTime();
      until = faker.date.soon({ refDate: since }).getTime();
    });

    it('should use correct until if nextPageToken is not provided', () => {
      const result = getPaginationInput(since, until);

      expect(result).toEqual({
        limit: 100,
        since,
        params: { until: until - 1 },
      });
    });

    it('should use nextPageToken if provided', () => {
      const nextPageToken: MexcNextPageToken = {
        oldestTradeAt: faker.date.recent({ refDate: until }).getTime(),
        movingDedupIds: [],
      };
      const result = getPaginationInput(since, until, nextPageToken);

      expect(result).toEqual({
        limit: 100,
        since,
        params: { until: nextPageToken.oldestTradeAt },
      });
    });
  });

  describe('handlePaginationResponse', () => {
    let paginationParams: MexcPaginationParams;

    beforeAll(() => {
      paginationParams = {
        until: faker.date.anytime().getTime(),
      };
    });

    it('should return empty trades if all are duplicates', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const currentPageToken = {
        movingDedupIds: _.map(trades, 'id'),
        oldestTradeAt: faker.date.anytime().getTime(),
      };

      const result = handlePaginationResponse({
        trades,
        currentPageToken,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result.trades).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });

    it('should generate correct oldestTradeAt and movingDedupIds when no duplicates', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const prevPageIds = Array.from({ length: 3 }, () => faker.string.ulid());

      const currentPageToken: MexcNextPageToken = {
        movingDedupIds: [...prevPageIds],
        oldestTradeAt: faker.date.anytime().getTime(),
      };

      const result = handlePaginationResponse({
        trades,
        currentPageToken,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result.nextPageToken).toBeDefined();
      expect(result.nextPageToken!.oldestTradeAt).toBe(
        trades.at(-1)!.timestamp,
      );
      expect(result.nextPageToken!.movingDedupIds.sort()).toEqual(
        [...prevPageIds, ..._.map(trades, 'id')].sort(),
      );
    });

    it('should filter out trades with duplicate ids', () => {
      const trades = [
        generateCcxtTrade({ id: '1' }),
        generateCcxtTrade({ id: '2' }),
        generateCcxtTrade({ id: '3' }),
      ];

      const currentPageToken: MexcNextPageToken = {
        movingDedupIds: ['2'],
        oldestTradeAt: faker.date.anytime().getTime(),
      };
      const result = handlePaginationResponse({
        trades,
        currentPageToken,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });
      expect(_.map(result.trades, 'id')).toEqual(['1', '3']);
    });
  });
});
