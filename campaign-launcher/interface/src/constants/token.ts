import bnbLogo from '../assets/tokens/bnb.png';
import btcLogo from '../assets/tokens/btc.png';
import ethLogo from '../assets/tokens/eth.png';
import usdcLogo from '../assets/tokens/usdc.png';
import usdtLogo from '../assets/tokens/usdt.png';
import xinLogo from '../assets/tokens/xin.png';
import { TokenData } from '../types';

export const TOKENS: TokenData[] = [
  {
    name: 'btc',
    icon: btcLogo,
  },
  {
    name: 'eth',
    icon: ethLogo,
  },
  {
    name: 'bnb',
    icon: bnbLogo,
  },
  {
    name: 'usdt',
    icon: usdtLogo,
  },
  {
    name: 'usdc',
    icon: usdcLogo,
  },
  {
    name: 'husd',
    icon: usdcLogo,
  },
  {
    name: '0xf15d41e06fe329427c643ed2203f14c409cb4b85',
    label: 'USDC',
    icon: usdcLogo,
  },
  {
    name: 'xin',
    icon: xinLogo,
  },
];
