import { faker } from '@faker-js/faker';

import { generateTxHash } from '~/test/fixtures/web3';

import { type Swap } from '../types';

export function generatePancakeswapSwap(overrides?: Partial<Swap>): Swap {
  const txHash = generateTxHash();

  const swap: Swap = {
    id: `${txHash}${faker.number.int({ max: 10 })}`,
    hash: txHash,
    nonce: faker.number.bigInt().toString(),
    timestamp: Math.round(faker.date.recent().valueOf() / 1000),
    amountIn: faker.number.float(),
    amountOut: faker.number.float(),
    tokenIn: faker.finance.ethereumAddress(),
    tokenOut: faker.finance.ethereumAddress(),
  };

  Object.assign(swap, overrides);

  return swap;
}
