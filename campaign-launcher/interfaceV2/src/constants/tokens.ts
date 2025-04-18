import bnbLogo from '../assets/tokens/bnb.png';
import btcLogo from '../assets/tokens/btc.png';
import ethLogo from '../assets/tokens/eth.png';
import hmtLogo from '../assets/tokens/hmt.png';
import usdcLogo from '../assets/tokens/usdc.png';
import usdtLogo from '../assets/tokens/usdt.png';
import xinLogo from '../assets/tokens/xin.png';
import { TokenData } from '../types';

export const TOKENS: TokenData[] = [
  {
    name: 'btc',
    label: 'BTC',
    icon: btcLogo,
  },
  {
    name: 'eth',
    label: 'ETH',
    icon: ethLogo,
  },
  {
    name: 'bnb',
    label: 'BNB',
    icon: bnbLogo,
  },
  {
    name: 'usdt',
    label: 'USDT',
    icon: usdtLogo,
  },
  {
    name: 'usdc',
    label: 'USDC',
    icon: usdcLogo,
  },
  {
    name: 'husd',
    label: 'HUSD',
    icon: usdcLogo,
  },
  {
    name: 'xin',
    label: 'XIN',
    icon: xinLogo,
  },
  {
    name: 'hmt',
    label: 'HMT',
    icon: hmtLogo,
  },
];

export const FUND_TOKENS = ['usdt', 'hmt'];
