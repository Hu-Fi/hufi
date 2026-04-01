import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';
import _ from 'lodash';

import {
  getPaginationInput,
  handlePaginationResponse,
  type XtNextPageToken,
} from './xt';
import { generateCcxtTrade } from '../fixtures';

const mockedCcxtClient = createMock<Exchange>();

describe('xt pagination helpers', () => {
  describe('getPaginationInput', () => {
    let since: number;
    let until: number;

    beforeEach(() => {
      since = faker.date.past().getTime();
      until = faker.date.soon({ refDate: since }).getTime();
    });

    it('should use until if nextPageToken is undefined', () => {
      const input = getPaginationInput(since, until);

      expect(input).toEqual({
        limit: 100,
        since,
        params: {
          direction: 'NEXT',
          endTime: until - 1,
        },
      });
    });

    it('should return correct pagination input with nextPageToken', () => {
      const nextPageToken: XtNextPageToken = {
        oldestTradeAt: faker.date.recent({ refDate: until }).getTime(),
        movingDedupIds: [faker.string.ulid()],
      };

      const input = getPaginationInput(since, until, nextPageToken);

      expect(input).toEqual({
        limit: 100,
        since,
        params: {
          direction: 'NEXT',
          endTime: nextPageToken.oldestTradeAt,
        },
      });
    });
  });

  describe('handlePaginationResponse', () => {
    const paginationParams = {};

    beforeAll(() => {
      mockedCcxtClient.parseJson.mockImplementation((json: string) =>
        JSON.parse(json),
      );
    });

    beforeEach(() => {
      mockedCcxtClient.last_http_response = JSON.stringify({
        result: {
          hasNext: true,
        },
      });
    });

    afterEach(() => {
      delete mockedCcxtClient.last_http_response;
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
      const currentPageToken: XtNextPageToken = {
        movingDedupIds: [],
        oldestTradeAt: faker.date.anytime().getTime(),
      };

      const result = handlePaginationResponse({
        trades,
        ccxtClient: mockedCcxtClient,
        currentPageToken,
        paginationParams,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toEqual({
        oldestTradeAt: trades.at(-1)!.timestamp,
        movingDedupIds: _.map(trades, 'id'),
      });
    });

    it('should filter out trades with duplicate ids', () => {
      const trades = [
        generateCcxtTrade({ id: '1' }),
        generateCcxtTrade({ id: '2' }),
        generateCcxtTrade({ id: '3' }),
      ];

      const currentPageToken: XtNextPageToken = {
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

    it('should not return nextPageToken if hasNext is false', () => {
      mockedCcxtClient.last_http_response = JSON.stringify({
        result: {
          hasNext: false,
        },
      });

      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      const currentPageToken: XtNextPageToken = {
        movingDedupIds: [],
        oldestTradeAt: faker.date.anytime().getTime(),
      };

      const result = handlePaginationResponse({
        trades,
        ccxtClient: mockedCcxtClient,
        currentPageToken,
        paginationParams,
      });

      expect(result.trades).toEqual(trades);
      expect(result.nextPageToken).toBeUndefined();
    });
  });
});
