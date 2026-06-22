import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { generateKucoinSpotTrade } from './fixtures';
import {
  getRawQuery,
  mapKcSymbolToSymbol,
  mapSymbolToKcSymbol,
  mapTrade,
} from './utils';

describe('KuCoin client utils', () => {
  describe('getRawQuery', () => {
    test('should serialize primitive params to query string', () => {
      const firstKey = faker.string.alpha(8);
      const firstValue = faker.string.alphanumeric(10);
      const secondKey = faker.string.alpha(8);
      const secondValue = faker.number.int();

      const query = getRawQuery({
        [firstKey]: firstValue,
        [secondKey]: secondValue,
      });

      expect(query).toBe(
        `${firstKey}=${firstValue}&${secondKey}=${secondValue}`,
      );
    });

    test('should serialize array params as repeated keys', () => {
      const key = faker.string.alpha(8);
      const firstValue = faker.string.alphanumeric(8);
      const secondValue = faker.string.alphanumeric(8);

      const query = getRawQuery({
        [key]: [firstValue, secondValue],
      });

      expect(query).toBe(`${key}=${firstValue}&${key}=${secondValue}`);
    });

    test('should skip undefined values', () => {
      const firstKey = faker.string.alpha(8);
      const firstValue = faker.string.alphanumeric(8);
      const secondKey = faker.string.alpha(8);
      const arrayKey = faker.string.alpha(8);
      const arrayValue = faker.string.alphanumeric(8);

      const query = getRawQuery({
        [firstKey]: firstValue,
        [secondKey]: undefined,
        [arrayKey]: [undefined, arrayValue, undefined],
      });

      expect(query).toBe(`${firstKey}=${firstValue}&${arrayKey}=${arrayValue}`);
    });

    test('should keep falsy non-undefined values', () => {
      const zeroKey = faker.string.alpha(8);
      const boolKey = faker.string.alpha(8);
      const nullKey = faker.string.alpha(8);

      const query = getRawQuery({
        [zeroKey]: 0,
        [boolKey]: false,
        [nullKey]: null,
      });

      expect(query).toBe(`${zeroKey}=0&${boolKey}=false&${nullKey}=null`);
    });

    test('should return empty string for empty params', () => {
      faker.string.uuid();

      expect(getRawQuery({})).toBe('');
    });
  });

  test('should map trading pair symbol to kucoin symbol', () => {
    const base = faker.finance.currencyCode();
    const quote = faker.finance.currencyCode();

    expect(mapSymbolToKcSymbol(`${base}/${quote}`)).toBe(`${base}-${quote}`);
  });

  test('should map kucoin symbol to trading pair symbol', () => {
    const base = faker.finance.currencyCode();
    const quote = faker.finance.currencyCode();

    expect(mapKcSymbolToSymbol(`${base}-${quote}`)).toBe(`${base}/${quote}`);
  });

  test('should map api spot trade to correct format', () => {
    const apiTrade = generateKucoinSpotTrade();

    const mappedTrade = mapTrade(apiTrade);

    expect(mappedTrade).toEqual({
      id: apiTrade.tradeId.toString(),
      symbol: mapKcSymbolToSymbol(apiTrade.symbol),
      timestamp: apiTrade.createdAt,
      takerOrMaker: apiTrade.liquidity,
      side: apiTrade.side,
      price: Number(apiTrade.price),
      amount: Number(apiTrade.size),
      cost: Number(apiTrade.funds),
    });
  });
});
