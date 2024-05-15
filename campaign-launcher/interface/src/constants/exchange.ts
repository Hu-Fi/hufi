import binanceLogo from '../assets/exchanges/binance.jpg';
import bitfinexLogo from '../assets/exchanges/bitfinex.png';
import exin1Logo from '../assets/exchanges/exin-one.png';
import fourSwapLogo from '../assets/exchanges/four-swap.png';
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
  {
    name: '4swap',
    label: '4swap',
    icon: fourSwapLogo,
  },
  {
    name: 'exin1',
    label: 'ExinOne',
    icon: exin1Logo,
  },
];
