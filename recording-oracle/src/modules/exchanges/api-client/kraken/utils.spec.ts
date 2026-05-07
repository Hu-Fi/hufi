import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test } from 'vitest';

import { ApiErrorCode, ApiPermissionErrorCode } from './constants';
import { KrakenApiError } from './error';
import {
  generateCsvTradeLine,
  generateOrderType,
  generateTradeTime,
} from './fixtures';
import {
  isApiPermissionError,
  isReportNotReadyError,
  mapReportRowToTrade,
  normalizeTimestamp,
  trimZipZeroBytes,
} from './utils';

describe('Kraken client utils', () => {
  describe('isApiPermissionError', () => {
    test('should return true for known API permission errors', () => {
      const apiErrorCode = faker.helpers.arrayElement(
        Object.values(ApiPermissionErrorCode),
      );
      const error = new KrakenApiError(apiErrorCode);

      expect(isApiPermissionError(error)).toBe(true);
    });

    test('should return false for unknown API errors', () => {
      const error = new KrakenApiError(ApiErrorCode.REPORT_NOT_READY);

      expect(isApiPermissionError(error)).toBe(false);
    });

    test('should return false for non-Kraken errors', () => {
      expect(isApiPermissionError(new Error(faker.lorem.words()))).toBe(false);
    });
  });

  describe('isReportNotReadyError', () => {
    test('should return true for report-not-ready API error', () => {
      const error = new KrakenApiError(ApiErrorCode.REPORT_NOT_READY);

      expect(isReportNotReadyError(error)).toBe(true);
    });

    test('should return false for permission API error', () => {
      const apiErrorCode = faker.helpers.arrayElement(
        Object.values(ApiPermissionErrorCode),
      );
      const error = new KrakenApiError(apiErrorCode);

      expect(isReportNotReadyError(error)).toBe(false);
    });

    test('should return false for non-Kraken errors', () => {
      expect(isReportNotReadyError(new Error(faker.lorem.words()))).toBe(false);
    });
  });

  describe('normalizeTimestamp', () => {
    let baseKrakenTimestamp: string;

    beforeEach(() => {
      baseKrakenTimestamp = generateTradeTime().formatted.split('.')[0];
    });

    test('should pad timestamp when no fractional digits', () => {
      expect(normalizeTimestamp(baseKrakenTimestamp)).toBe(
        `${baseKrakenTimestamp}.000`,
      );
    });

    test('should normalize a timestamp with more than 3 fractional digits by truncating', () => {
      const msPart = faker.number.int({ min: 1000 }).toString();
      expect(normalizeTimestamp(`${baseKrakenTimestamp}.${msPart}`)).toBe(
        `${baseKrakenTimestamp}.${msPart.slice(0, 3)}`,
      );
    });

    test('should keep timestamp with exactly 3 fractional digits unchanged', () => {
      const msPart = faker.number.int({ min: 100, max: 999 }).toString();
      expect(normalizeTimestamp(`${baseKrakenTimestamp}.${msPart}`)).toBe(
        `${baseKrakenTimestamp}.${msPart}`,
      );
    });

    test('should pad a timestamp with less than 3 fractional digits to 3', () => {
      const msPart = faker.number.int({ min: 1, max: 99 }).toString();

      expect(normalizeTimestamp(`${baseKrakenTimestamp}.${msPart}`)).toBe(
        `${baseKrakenTimestamp}.${msPart.padEnd(3, '0')}`,
      );
    });
  });

  describe('trimZipZeroBytes', () => {
    function buildEocd(commentLength = 0): Buffer {
      const eocd = Buffer.alloc(22 + commentLength, 0);
      // EOCD signature
      eocd.writeUInt32LE(0x06054b50, 0);
      // comment length at offset 20
      eocd.writeUInt16LE(commentLength, 20);
      return eocd;
    }

    test('should return the buffer unchanged when there are no trailing bytes', () => {
      const zip = buildEocd();

      const result = trimZipZeroBytes(zip);

      expect(result).toEqual(zip);
    });

    test('should trim trailing zero bytes after the EOCD record', () => {
      const eocd = buildEocd();
      const starting = Buffer.alloc(10, 0);
      const trailing = Buffer.alloc(10, 0);
      const zip = Buffer.concat([starting, eocd, trailing]);

      const result = trimZipZeroBytes(zip);

      const expected = Buffer.concat([starting, eocd]);
      expect(result.length).toBe(expected.length);
      expect(result).toEqual(expected);
    });

    test('should preserve EOCD with a ZIP comment', () => {
      const comment = Buffer.from(faker.lorem.sentence());
      const eocd = buildEocd(comment.length);
      comment.copy(eocd, 22);
      const starting = Buffer.alloc(10, 0);
      const trailing = Buffer.alloc(10, 0);
      const zip = Buffer.concat([starting, eocd, trailing]);

      const result = trimZipZeroBytes(zip);

      const expected = Buffer.concat([starting, eocd]);
      expect(result.length).toBe(expected.length);
      expect(result).toEqual(expected);
    });

    test('should throw when no EOCD signature is found', () => {
      const invalid = Buffer.alloc(30, 0xff);
      expect(() => trimZipZeroBytes(invalid)).toThrow(
        'EOCD record not found. Not a valid ZIP buffer',
      );
    });
  });

  describe('mapReportRowToTrade', () => {
    test('should throw when report pair is not in BASE/QUOTE format', () => {
      const csvTrade = generateCsvTradeLine({
        pair: `${faker.finance.currencyCode()}${faker.finance.currencyCode()}`,
      });

      expect(() => mapReportRowToTrade(csvTrade)).toThrow(
        `Unexpected pair format in report: ${csvTrade.pair}`,
      );
    });

    test('should throw when report timestamp cannot be parsed', () => {
      const csvTrade = generateCsvTradeLine();
      csvTrade.time = new Date(csvTrade.__timestamp).toISOString();

      expect(() => mapReportRowToTrade(csvTrade)).toThrow(
        `Invalid timestamp format in report: ${csvTrade.time}`,
      );
    });

    test('should correctly map base data from csv row to trade', () => {
      const csvTrade = generateCsvTradeLine();

      const trade = mapReportRowToTrade(csvTrade);

      expect(trade).toEqual({
        id: csvTrade.txid,
        timestamp: csvTrade.__timestamp,
        symbol: csvTrade.pair,
        side: csvTrade.type,
        takerOrMaker: expect.stringMatching(/^(taker|maker)$/),
        price: Number(csvTrade.price),
        amount: Number(csvTrade.vol),
        cost: Number(csvTrade.cost),
      });
    });

    test('should map infer maker for non-initiated limit order', () => {
      const csvTrade = generateCsvTradeLine({
        ordertype: 'limit',
        misc: '',
      });

      const trade = mapReportRowToTrade(csvTrade);

      expect(trade.takerOrMaker).toBe('maker');
    });

    test('should map taker for initiated order', () => {
      const csvTrade = generateCsvTradeLine({
        misc: 'initiated',
      });

      const trade = mapReportRowToTrade(csvTrade);

      expect(trade.takerOrMaker).toBe('taker');
    });

    test('should map taker for non-limit order', () => {
      const csvTrade = generateCsvTradeLine({
        ordertype: generateOrderType(['limit']),
        misc: '',
      });

      const trade = mapReportRowToTrade(csvTrade);

      expect(trade.takerOrMaker).toBe('taker');
    });
  });
});
