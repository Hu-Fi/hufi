import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

import { ReportCsvRow } from '../types';

const BASE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export function generateTradeTime(date = faker.date.past()): {
  formatted: string;
  timestamp: number;
} {
  const baseTime = dayjs(date).format(BASE_TIME_FORMAT);

  const msPart = faker.number
    .int({ min: 1, max: 9999 })
    .toString()
    .padStart(4, '0');

  return {
    formatted: `${baseTime}.${msPart}`,
    timestamp: dayjs(
      `${baseTime}.${msPart.substring(0, 3)}Z`,
      `${BASE_TIME_FORMAT}.SSSZ`,
    ).valueOf(),
  };
}

export function generateOrderType(
  ignored: string[] = [],
): ReportCsvRow['ordertype'] {
  return faker.helpers.arrayElement(
    [
      'limit',
      'market',
      'touched market',
      'stop market',
      'liquidation market',
    ].filter((e) => !ignored.includes(e)),
  );
}

type ReportCsvRowFixture = ReportCsvRow & { __timestamp: number };

export function generateCsvTradeLine(
  overrides?: Omit<Partial<ReportCsvRow>, 'time'>,
): ReportCsvRowFixture {
  const price = faker.number.float({ min: 0.01, max: 100_000 });
  const amount = faker.number.float({ min: 0.001, max: 1_000 });

  const tradeTime = generateTradeTime();

  const csvTrade: ReportCsvRowFixture = {
    txid: [6, 5, 6]
      .map((l) => faker.string.alphanumeric(l))
      .join('-')
      .toUpperCase(),
    time: tradeTime.formatted,
    pair: `${faker.finance.currencyCode()}-${faker.finance.currencyCode()}`,
    type: faker.helpers.arrayElement(['buy', 'sell'] as const),
    price: price.toString(),
    vol: amount.toString(),
    cost: (price * amount).toString(),
    ordertype: generateOrderType(),
    misc: faker.helpers.arrayElement(['', 'initiated', 'closing']),
    // internal fields for tests
    __timestamp: tradeTime.timestamp,
  };

  Object.assign(csvTrade, overrides);

  return csvTrade;
}
