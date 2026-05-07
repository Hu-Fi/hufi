import { Wallet } from 'ethers';
import { vi } from 'vitest';
import type { Mock, Mocked } from 'vitest';

export function generateEthWallet(privateKey?: string) {
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();

  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

export type SignerMock = Mocked<Pick<Wallet, 'sendTransaction'>> & {
  __transactionResponse: {
    wait: Mock;
  };
};

export function createSignerMock(): SignerMock {
  const transactionResponse = {
    wait: vi.fn(),
  };

  return {
    sendTransaction: vi.fn().mockResolvedValue(transactionResponse),
    __transactionResponse: transactionResponse,
  };
}
