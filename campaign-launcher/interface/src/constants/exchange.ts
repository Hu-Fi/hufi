import bigoneLogo from '../assets/exchanges/bigone.png';
import binanceLogo from '../assets/exchanges/binance.jpg';
import bitfinexLogo from '../assets/exchanges/bitfinex.png';
import exin1Logo from '../assets/exchanges/exin-one.png';
import fourSwapLogo from '../assets/exchanges/four-swap.png';
import lbankLogo from '../assets/exchanges/lbank.png';
import mexcLogo from '../assets/exchanges/mexc.jpeg';
import uniswapLogo from '../assets/exchanges/uniswap.svg';
import { ExchangeData, ExchangeName } from '../types';

export const EXCHANGES: ExchangeData[] = [
  {
    name: ExchangeName.Binance,
    label: 'Binance',
    icon: binanceLogo,
  },
  {
    name: ExchangeName.Bitfinex,
    label: 'Bitfinex',
    icon: bitfinexLogo,
  },
  {
    name: ExchangeName.MEXC,
    label: 'MEXC Exchange',
    icon: mexcLogo,
  },
  {
    name: ExchangeName.FourSwap,
    label: '4swap',
    icon: fourSwapLogo,
  },
  {
    name: ExchangeName.ExinOne,
    label: 'ExinOne',
    icon: exin1Logo,
  },
  {
    name: ExchangeName.Uniswap,
    label: 'Uniswap',
    icon: uniswapLogo,
  },
  {
    name: ExchangeName.BigOne,
    label: 'BigOne',
    icon: bigoneLogo,
  },
  {
    name: ExchangeName.LBank,
    label: 'LBank',
    icon: lbankLogo,
  },
];
