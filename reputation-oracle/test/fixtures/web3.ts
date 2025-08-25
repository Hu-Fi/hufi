import { Wallet } from 'ethers';

export function generateEthWallet(privateKey?: string) {
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();

  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

export type SignerMock = jest.Mocked<Pick<Wallet, 'sendTransaction'>> & {
  __transactionResponse: {
    wait: jest.Mock;
  };
};

export function createSignerMock(): SignerMock {
  const transactionResponse = {
    wait: jest.fn(),
  };

  return {
    sendTransaction: jest.fn().mockResolvedValue(transactionResponse),
    __transactionResponse: transactionResponse,
  };
}
