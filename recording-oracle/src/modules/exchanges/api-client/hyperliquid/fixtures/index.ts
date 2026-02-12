import { faker } from '@faker-js/faker';
import type { Trade as CcxtTrade } from 'ccxt';

import { generateCcxtTrade } from '../../ccxt/fixtures';

export function generateHyperliquidWalletAddress(): string {
  return faker.finance.ethereumAddress();
}

export function generateHyperliquidCcxtTrade(
  overrides?: Partial<CcxtTrade>,
): CcxtTrade {
  const trade = generateCcxtTrade({
    symbol: 'HYPE/USDC',
  });

  return {
    ...trade,
    ...overrides,
  };
}
