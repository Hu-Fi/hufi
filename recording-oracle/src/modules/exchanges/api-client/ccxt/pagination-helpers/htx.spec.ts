import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Trade as CcxtTrade, Exchange } from 'ccxt';

import { generateCcxtTrade } from '../fixtures';
import {
  getPaginationInput,
  handlePaginationResponse,
  TradesPaginationRecord,
  type HtxNextPageToken,
} from './htx';

const mockedCcxtClient = createMock<Exchange>();

function generatePaginationRecord(trade?: CcxtTrade): TradesPaginationRecord {
  return {
    id: faker.string.uuid(),
    tradeId: trade?.id || faker.string.uuid(),
  };
}

describe('htx pagination helpers', () => {
  describe('getPaginationInput', () => {
    let since: number;
    let until: number;

    beforeEach(() => {
      since = faker.date.past().getTime();
      until = faker.date.soon({ refDate: since }).getTime();
    });

    it('should return correct params when no nextPageToken', () => {
      const result = getPaginationInput(since, until);

      expect(result).toEqual({
        since: since - 1,
        params: {
          until,
          size: 250,
          direct: 'next',
        },
      });
    });

    it('should include "from" param if nextPageToken is provided', () => {
      const since = 100;
      const until = 200;
      const nextPageToken: HtxNextPageToken = {
        oldestPaginationRecord: generatePaginationRecord(),
      };
      const result = getPaginationInput(since, until, nextPageToken);

      expect(result).toEqual({
        since: since - 1,
        params: {
          until,
          size: 250,
          direct: 'next',
          from: nextPageToken.oldestPaginationRecord.id,
        },
      });
    });
  });

  describe('handlePaginationResponse', () => {
    const paginationParams = {};

    it('should work if currentPageToken is undefined (first page)', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      for (const trade of trades) {
        trade.info = generatePaginationRecord(trade);
      }

      const result = handlePaginationResponse({
        trades,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toEqual({
        oldestPaginationRecord: trades.at(-1)!.info as TradesPaginationRecord,
      });
    });

    it('should filter out the current pagination record used in "from"', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      for (const trade of trades) {
        trade.info = generatePaginationRecord(trade);
      }

      const currentPageToken: HtxNextPageToken = {
        oldestPaginationRecord: trades[0].info as TradesPaginationRecord,
      };

      const result = handlePaginationResponse({
        trades,
        currentPageToken,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result.trades.length).toBe(2);
      expect(result.trades).toEqual(trades.slice(1));
      expect(result.nextPageToken).toEqual({
        oldestPaginationRecord: trades.at(-1)!.info as TradesPaginationRecord,
      });
    });

    it('should return empty trades if all duplicates (last page)', () => {
      const trade = generateCcxtTrade();
      trade.info = generatePaginationRecord(trade);

      const currentPageToken: HtxNextPageToken = {
        oldestPaginationRecord: trade.info as TradesPaginationRecord,
      };

      const result = handlePaginationResponse({
        trades: [trade],
        currentPageToken,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result.trades).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });
  });
});
