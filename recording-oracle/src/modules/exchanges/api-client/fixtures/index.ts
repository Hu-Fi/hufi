import { faker } from '@faker-js/faker';

import { ExchangeConfig } from '@/config';

import { TradingSide, TakerOrMakerFlag } from '../types';

const TRADING_SIDES = Object.values(TradingSide);
export function generateTradingSide(): TradingSide {
  return faker.helpers.arrayElement(TRADING_SIDES);
}

const TAKER_OR_MAKER_FLAGS = Object.values(TakerOrMakerFlag);
export function generateTakerOrMakerFlag(): TakerOrMakerFlag {
  return faker.helpers.arrayElement(TAKER_OR_MAKER_FLAGS);
}

export function generateConfigByExchangeStub(config: ExchangeConfig) {
  return new Proxy(
    {},
    {
      get() {
        return config;
      },
    },
  );
}
