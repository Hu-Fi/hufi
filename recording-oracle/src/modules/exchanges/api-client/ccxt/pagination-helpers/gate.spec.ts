import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import type { Exchange } from 'ccxt';

import { generateCcxtTrade } from '../fixtures';
import {
  type GatePaginationParams,
  getPaginationInput,
  handlePaginationResponse,
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
          until,
          page: 1,
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
          until,
          page: nextPageToken,
        },
        limit: 250,
      });
    });
  });

  describe('handlePaginationResponse', () => {
    it('should increment page if lastPage < 100', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const paginationParams: GatePaginationParams = {
        until: faker.date.anytime().getTime(),
        page: faker.number.int({ min: 1, max: 99 }),
      };

      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toBe(trades);
      expect(result.nextPageToken).toBe(paginationParams.page + 1);
    });

    it('should not return nextPageToken if lastPage is 100', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const paginationParams: GatePaginationParams = {
        until: faker.date.anytime().getTime(),
        page: 100,
      };
      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toBe(trades);
      expect(result.nextPageToken).toBeUndefined();
    });

    it('should not return nextPageToken if lastPage > 100', () => {
      const trades = Array.from({ length: 3 }, () => generateCcxtTrade());

      const paginationParams: GatePaginationParams = {
        until: faker.date.anytime().getTime(),
        page: faker.number.int({ min: 100 }),
      };
      const result = handlePaginationResponse({
        trades,
        paginationParams,
        ccxtClient: mockedCcxtClient,
      });

      expect(result.trades).toBe(trades);
      expect(result.nextPageToken).toBeUndefined();
    });
  });
});
