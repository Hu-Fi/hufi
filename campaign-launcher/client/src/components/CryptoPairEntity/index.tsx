import type { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { getSymbolStyles } from '@/components/CampaignSymbol';
import { getTokenInfo } from '@/utils';

type Props = {
  symbol: string;
  size?: 'xs' | 'small' | 'medium' | 'large';
};

const CryptoPairEntity: FC<Props> = ({ symbol, size = 'small' }) => {
  const [base, quote] = symbol.split('/');

  const { icon: baseIcon, label: baseLabel } = getTokenInfo(base);
  const { icon: quoteIcon, label: quoteLabel } = getTokenInfo(quote);

  const isLarge = size === 'large';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: isLarge ? 2 : 1,
      }}
    >
      {baseIcon && quoteIcon && (
        <>
          <Box
            component="img"
            src={baseIcon}
            alt={baseLabel}
            sx={{
              width: getSymbolStyles(size).image.size,
              height: getSymbolStyles(size).image.size,
              border: getSymbolStyles(size).image.border,
              borderRadius: '100%',
            }}
          />
          <Box
            component="img"
            src={quoteIcon}
            alt={quoteLabel}
            sx={{
              ml: isLarge ? -4 : -2,
              width: getSymbolStyles(size).image.size,
              height: getSymbolStyles(size).image.size,
              border: getSymbolStyles(size).image.border,
              borderRadius: '100%',
            }}
          />
        </>
      )}
      <Typography
        sx={{
          color: 'white',
          ...getSymbolStyles(size).text,
        }}
      >
        {baseLabel ?? base}/{quoteLabel ?? quote}
      </Typography>
    </Box>
  );
};

export default CryptoPairEntity;
