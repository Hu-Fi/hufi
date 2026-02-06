import { faker } from '@faker-js/faker';
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

function corruptAddressChecksum(checksummedAddress: string): string {
  let corruptedAddress = `0x`;
  for (let i = 2; i < checksummedAddress.length; i += 1) {
    const char = checksummedAddress.charAt(i);
    if (char.charCodeAt(0) > '9'.charCodeAt(0)) {
      const flippedChar =
        char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase();

      corruptedAddress += flippedChar;
      corruptedAddress += checksummedAddress.slice(i + 1);
      break;
    } else {
      corruptedAddress += char;
    }
  }

  return corruptedAddress;
}

export function generateInvalidEvmAddress(): string {
  const checksummedAddress = Wallet.createRandom().address;

  if (faker.number.int() < 42) {
    return corruptAddressChecksum(checksummedAddress);
  } else {
    /**
     * Uppercased addresses considered invalid by ethers.js
     */
    return checksummedAddress.toUpperCase();
  }
}

export function generateTxHash(): string {
  return faker.string.hexadecimal({ length: 64, casing: 'lower' });
}
