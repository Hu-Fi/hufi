import bnbLogo from '@/assets/tokens/bnb.png';
import btcLogo from '@/assets/tokens/btc.png';
import ethLogo from '@/assets/tokens/eth.png';
import hmtLogo from '@/assets/tokens/hmt.png';
import icbxLogo from '@/assets/tokens/icbx.png';
import usdcLogo from '@/assets/tokens/usdc.png';
import usdtLogo from '@/assets/tokens/usdt.png';
import xinLogo from '@/assets/tokens/xin.png';
import type { TokenData } from '@/types';

export const TOKENS: TokenData[] = [
  {
    name: 'hmt',
    label: 'HMT',
    icon: hmtLogo,
  },
  {
    name: 'usdt',
    label: 'USDT0',
    icon: usdtLogo,
  },
  {
    name: 'usdc',
    label: 'USDC',
    icon: usdcLogo,
  },
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
    name: 'icbx',
    label: 'ICBX',
    icon: icbxLogo,
  },
];

export const FUND_TOKENS = ['hmt', 'usdt', 'usdc'] as const;
export type FundToken = (typeof FUND_TOKENS)[number];
