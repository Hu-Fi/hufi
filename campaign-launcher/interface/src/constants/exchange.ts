import binanceLogo from '../assets/exchanges/binance.jpg';
import bitfinexLogo from '../assets/exchanges/bitfinex.png';
import mexcLogo from '../assets/exchanges/mexc.jpeg';
import { ExchangeData } from '../types';

export const EXCHANGES: ExchangeData[] = [
  {
    name: 'binance',
    label: 'Binance',
    icon: binanceLogo,
  },
  {
    name: 'bitfinex',
    label: 'Bitfinex',
    icon: bitfinexLogo,
  },
  {
    name: 'mexc',
    label: 'MEXC Exchange',
    icon: mexcLogo,
  },
];
