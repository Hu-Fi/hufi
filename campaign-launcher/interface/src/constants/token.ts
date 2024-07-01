import bnbLogo from '../assets/tokens/bnb.png';
import btcLogo from '../assets/tokens/btc.png';
import ethLogo from '../assets/tokens/eth.png';
import usdcLogo from '../assets/tokens/usdc.png';
import usdtLogo from '../assets/tokens/usdt.png';
import xinLogo from '../assets/tokens/xin.png';
import { TokenData, TokenName } from '../types';

export const TOKENS: TokenData[] = [
  {
    name: TokenName.BTC,
    label: 'BTC',
    icon: btcLogo,
  },
  {
    name: TokenName.ETH,
    label: 'ETH',
    icon: ethLogo,
  },
  {
    name: TokenName.BNB,
    label: 'BNB',
    icon: bnbLogo,
  },
  {
    name: TokenName.USDT,
    label: 'USDT',
    icon: usdtLogo,
  },
  {
    name: TokenName.USDC,
    label: 'USDC',
    icon: usdcLogo,
  },
  {
    name: TokenName.HUSD,
    label: 'HUSD',
    icon: usdcLogo,
  },
  {
    name: '0xf15d41e06fe329427c643ed2203f14c409cb4b85',
    label: 'HUSD',
    icon: usdcLogo,
  },
  {
    name: TokenName.XIN,
    label: 'XIN',
    icon: xinLogo,
  },
];
