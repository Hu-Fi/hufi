import { ethers } from 'ethers';

import { NotValidEvmAddressError } from '@/common/errors/web3';

type SignatureMessage = object | string;

export function generateNonce(): string {
  return Buffer.from(ethers.randomBytes(16)).toString('hex');
}

export function assertValidEvmAddress(address: string): void {
  if (!ethers.isAddress(address)) {
    throw new NotValidEvmAddressError(address);
  }
}

export async function signMessage(
  message: SignatureMessage,
  privateKey: string,
): Promise<string> {
  const _message = prepareSignatureMessage(message);

  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(_message);

  return signature;
}

export function verifySignature(
  message: SignatureMessage,
  signature: string,
  addresses: string[],
): boolean {
  let signerAddress = recoverSignerAddress(message, signature);
  if (!signerAddress) {
    return false;
  }

  signerAddress = signerAddress.toLowerCase();

  return addresses.some((address) => address.toLowerCase() === signerAddress);
}

export function recoverSignerAddress(
  message: SignatureMessage,
  signature: string,
): string | null {
  const _message = prepareSignatureMessage(message);

  try {
    return ethers.verifyMessage(_message, signature);
  } catch (noop) {
    return null;
  }
}

function prepareSignatureMessage(message: SignatureMessage): string {
  if (typeof message === 'string') {
    return message;
  } else {
    return JSON.stringify(message);
  }
}
