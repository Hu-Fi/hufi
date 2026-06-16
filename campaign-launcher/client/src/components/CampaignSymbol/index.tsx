import type { FC } from 'react';

import CryptoEntity from '@/components/CryptoEntity';
import CryptoPairEntity from '@/components/CryptoPairEntity';
import { type CampaignType } from '@/types';
import { isBalanceBasedCampaignType, isVolumeBasedCampaignType } from '@/utils';

type Props = {
  symbol: string;
  campaignType: CampaignType;
  size?: 'xs' | 'small' | 'medium' | 'large';
};

export const getSymbolStyles = (size: 'xs' | 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'xs':
      return {
        image: {
          size: 16,
          border: '1px solid white',
        },
        text: {
          fontWeight: 500,
          fontSize: 16,
        },
      };
    case 'small':
      return {
        image: {
          size: 22,
          border: '1px solid white',
        },
        text: {
          fontWeight: 600,
          fontSize: 20,
        },
      };
    case 'medium':
      return {
        image: {
          size: 32,
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
          size: 32,
          border: '2px solid white',
        },
        text: {
          fontWeight: 800,
          fontSize: 32,
          lineHeight: '36px',
        },
      };
    default:
      return {
        image: {
          size: 22,
          border: '1px solid white',
        },
        text: {
          fontWeight: 600,
          fontSize: 20,
        },
      };
  }
};

const CampaignSymbol: FC<Props> = ({
  symbol,
  campaignType,
  size = 'small',
}) => {
  if (isVolumeBasedCampaignType(campaignType)) {
    return <CryptoPairEntity symbol={symbol} size={size} />;
  } else if (isBalanceBasedCampaignType(campaignType)) {
    return <CryptoEntity symbol={symbol} size={size} />;
  }
};

export default CampaignSymbol;
