import { Exchange, ExchangeType } from '../types/exchange';

export const SUPPORTED_DEX_LIST: Exchange[] = [
  {
    name: 'uniswap',
    displayName: 'Uniswap',
    url: 'https://app.uniswap.org/',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Uniswap_Logo.svg',
    type: ExchangeType.DEX,
  },
];
