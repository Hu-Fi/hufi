import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';

import { generateCcxtTrade } from '../fixtures';
import {
  type BybitPaginationParams,
  getPaginationInput,
  handlePaginationResponse,
} from './bybit';

const mockedCcxtClient = createMock<Exchange>();

describe('bybit pagination helpers', () => {
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
        since,
        params: {
          endTime: until - 1,
        },
        limit: 100,
      });
    });

    it('should include cursor when nextPageToken is provided', () => {
      const nextPageToken = faker.string.alphanumeric({ length: 42 });

      const result = getPaginationInput(since, until, nextPageToken);

      expect(result).toEqual({
        since,
        params: {
          endTime: until - 1,
          cursor: nextPageToken,
        },
        limit: 100,
      });
    });
  });

  describe('handlePaginationResponse', () => {
    let paginationParams: BybitPaginationParams;

    beforeAll(() => {
      mockedCcxtClient.parseJson.mockImplementation((json: string) =>
        JSON.parse(json),
      );
      paginationParams = {
        endTime: faker.date.anytime().getTime(),
      };
    });

    afterEach(() => {
      delete mockedCcxtClient.last_http_response;
    });

    it('should extract nextPageToken from response', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());
      const nextPageCursor = faker.string.alphanumeric({ length: 42 });

      mockedCcxtClient.last_http_response = JSON.stringify({
        result: {
          nextPageCursor,
        },
      });

      const result = handlePaginationResponse({
        trades,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result).toEqual({
        trades,
        nextPageToken: nextPageCursor,
      });
    });

    it('should handle missing nextPageCursor', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      mockedCcxtClient.last_http_response = JSON.stringify({ result: {} });

      const result = handlePaginationResponse({
        trades,
        ccxtClient: mockedCcxtClient,
        paginationParams,
      });

      expect(result).toEqual({ trades });
    });
  });
});
