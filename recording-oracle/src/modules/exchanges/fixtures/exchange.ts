import { faker } from '@faker-js/faker';

import { ExchangeName } from '@/common/constants';
import { ExchangesConfigService, type ExchangeConfig } from '@/config';

const EXCHANGE_NAMES = Object.values(ExchangeName);
export function generateExchangeName(): ExchangeName {
  return faker.helpers.arrayElement(EXCHANGE_NAMES);
}

export function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}

export const mockExchangesConfigService: Omit<
  ExchangesConfigService,
  'configService' | 'configByExchange'
> & {
  configByExchange: Record<string, ExchangeConfig>;
} = {
  useSandbox: true,
  configByExchange: {},
  isExchangeSupported(exchangeName: string): exchangeName is ExchangeName {
    return exchangeName in this.configByExchange;
  },
};
