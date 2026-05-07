import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import type { Exchange } from 'ccxt';
import _ from 'lodash';
import { beforeEach, describe, expect, it } from 'vitest';

import { generateCcxtTrade } from '../fixtures';
import {
  type BitmartNextPageToken,
  getPaginationInput,
  handlePaginationResponse,
} from './bitmart';

const mockedCcxtClient = createMock<Exchange>();

describe('bitmart pagination helpers', () => {
  describe('getPaginationInput', () => {
    let since: number;
    let until: number;

    beforeEach(() => {
      since = faker.date.past().getTime();
      until = faker.date.soon({ refDate: since }).getTime();
    });

    it('should return correct input when no nextPageToken', () => {
      const result = getPaginationInput(since, until);

      expect(result).toEqual({
        limit: 200,
        since: since,
        params: { endTime: until - 1 },
      });
    });

    it('should use nextPageToken for endTime if provided', () => {
      const oldestTradeAt = faker.date.recent({ refDate: since }).getTime();

      const result = getPaginationInput(since, until, {
        oldestTradeAt,
        movingDedupIds: [],
      });

      expect(result).toEqual({
        limit: 200,
        since,
        params: { endTime: oldestTradeAt },
      });
    });
  });

  describe('handlePaginationResponse', () => {
    const paginationParams = {};

    it('should return empty trades if all are duplicates', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const currentPageToken: BitmartNextPageToken = {
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

      const currentPageToken: BitmartNextPageToken = {
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
      expect(result.nextPageToken!.movingDedupIds).toEqual([
        ...prevPageIds,
        ..._.map(trades, 'id'),
      ]);
    });

    it('should filter out trades with duplicate ids', () => {
      const trades = [
        generateCcxtTrade({ id: '1' }),
        generateCcxtTrade({ id: '2' }),
        generateCcxtTrade({ id: '3' }),
      ];

      const currentPageToken: BitmartNextPageToken = {
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
      expect(result.nextPageToken).toEqual({
        oldestTradeAt: trades.at(-1)!.timestamp,
        movingDedupIds: ['2', '1', '3'],
      });
    });
  });
});
