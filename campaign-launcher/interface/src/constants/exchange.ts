import bigoneLogo from '../assets/exchanges/bigone.png';
import binanceLogo from '../assets/exchanges/binance.jpg';
import bitfinexLogo from '../assets/exchanges/bitfinex.png';
import exin1Logo from '../assets/exchanges/exin-one.png';
import fourSwapLogo from '../assets/exchanges/four-swap.png';
import lbankLogo from '../assets/exchanges/lbank.png';
import mexcLogo from '../assets/exchanges/mexc.png';
import uniswapLogo from '../assets/exchanges/uniswap.svg';
import { ExchangeData, ExchangeName, ExchangeType } from '../types';

export const EXCHANGES: ExchangeData[] = [
  {
    name: ExchangeName.Binance,
    label: 'Binance',
    type: ExchangeType.CEX,
    icon: binanceLogo,
  },
  {
    name: ExchangeName.Bitfinex,
    label: 'Bitfinex',
    type: ExchangeType.CEX,
    icon: bitfinexLogo,
  },
  {
    name: ExchangeName.MEXC,
    label: 'MEXC Exchange',
    type: ExchangeType.CEX,
    icon: mexcLogo,
  },
  {
    name: ExchangeName.BigOne,
    label: 'BigOne',
    type: ExchangeType.CEX,
    icon: bigoneLogo,
  },
  {
    name: ExchangeName.LBank,
    label: 'LBank',
    type: ExchangeType.CEX,
    icon: lbankLogo,
  },
  {
    name: ExchangeName.Uniswap,
    label: 'Uniswap',
    type: ExchangeType.DEX,
    icon: uniswapLogo,
  },
  {
    name: ExchangeName.FourSwap,
    label: '4swap',
    type: ExchangeType.DEX,
    icon: fourSwapLogo,
  },
  {
    name: ExchangeName.ExinOne,
    label: 'ExinOne',
    type: ExchangeType.DEX,
    icon: exin1Logo,
  },
];
