import type { FC } from 'react';

import { CryptoEntity } from '@/components/CryptoEntity';
import { CryptoPairEntity } from '@/components/CryptoPairEntity';
import { CampaignType } from '@/types';

type Props = {
  symbol: string;
  campaignType: CampaignType;
  size?: 'small' | 'medium' | 'large';
};

export const getSymbolStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        image: {
          width: 24,
          border: '1px solid white',
        },
        text: {
          fontWeight: 400,
          fontSize: 16,
        },
      };
    case 'medium':
      return {
        image: {
          width: 32,
          border: '1px solid white',
        },
        text: {
          fontWeight: 700,
          fontSize: 20,
        },
      };
    case 'large':
      return {
        image: {
          width: 72,
          border: '2px solid white',
        },
        text: {
          fontWeight: 800,
          fontSize: 30,
          lineHeight: '35px',
        },
      };
    default:
      return {
        image: {
          width: 24,
          border: '1px solid white',
        },
        text: {
          fontWeight: 400,
          fontSize: 16,
        },
      };
  }
};

const CampaignSymbol: FC<Props> = ({
  symbol,
  campaignType,
  size = 'small',
}) => {
  if (campaignType === CampaignType.MARKET_MAKING) {
    return <CryptoPairEntity symbol={symbol} size={size} />;
  } else if (campaignType === CampaignType.HOLDING) {
    return <CryptoEntity symbol={symbol} size={size} />;
  }
};

export default CampaignSymbol;
