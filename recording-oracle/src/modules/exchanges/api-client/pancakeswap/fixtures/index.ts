import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

import { generateTxHash } from '~/test/fixtures/web3';

import { SubgraphSwapData } from '../queries';
import { type Swap } from '../types';

function generateSwapId(txHash: string): string {
  return `${txHash}${faker.number.int({ max: 10 })}`;
}

export function generateSubgraphSwapData(): SubgraphSwapData {
  const txHash = generateTxHash();

  const tokenInDecimals = faker.number.int({ min: 6, max: 18 });
  const tokenOutDecimals = faker.number.int({ min: 6, max: 18 });

  return {
    id: generateSwapId(txHash),
    hash: txHash,
    nonce: faker.number.bigInt().toString(),
    timestamp: Math.round(faker.date.recent().valueOf() / 1000).toString(),
    amountIn: ethers
      .parseUnits(
        faker.number.float(42).toFixed(tokenInDecimals),
        tokenInDecimals,
      )
      .toString(),
    amountOut: ethers
      .parseUnits(
        faker.number.float(42).toFixed(tokenOutDecimals),
        tokenOutDecimals,
      )
      .toString(),
    tokenIn: {
      id: faker.finance.ethereumAddress(),
      decimals: tokenInDecimals,
    },
    tokenOut: {
      id: faker.finance.ethereumAddress(),
      decimals: tokenOutDecimals,
    },
  };
}

export function generatePancakeswapSwap(overrides?: Partial<Swap>): Swap {
  const txHash = generateTxHash();

  const swap: Swap = {
    id: generateSwapId(txHash),
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
