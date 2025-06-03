import { ethers } from 'ethers';

import { NotValidEvmAddressError } from '../common/errors/web3';

export function generateNonce(): string {
  return Buffer.from(ethers.randomBytes(16)).toString('hex');
}

export function assertValidEvmAddress(address: string): void {
  if (!ethers.isAddress(address)) {
    throw new NotValidEvmAddressError(address);
  }
}
