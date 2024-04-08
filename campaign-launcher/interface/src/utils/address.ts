import { getAddress } from 'viem';

export function isAddress(value: string): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address);
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`;
}
