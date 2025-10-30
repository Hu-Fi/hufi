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
    <Box display="flex" alignItems="center" gap={isLarge ? 2 : 1}>
      {baseIcon && quoteIcon && (
        <>
          <Box
            component="img"
            src={baseIcon}
            alt={baseLabel}
            borderRadius="100%"
            {...getSymbolStyles(size).image}
          />
          <Box
            component="img"
            src={quoteIcon}
            alt={quoteLabel}
            marginLeft={isLarge ? -4 : -2}
            borderRadius="100%"
            {...getSymbolStyles(size).image}
          />
        </>
      )}
      <Typography color="primary" {...getSymbolStyles(size).text}>
        {isLarge ? (
          <>
            {baseLabel ?? base}
            <br />
            {quoteLabel ?? quote}
          </>
        ) : (
          <>
            {baseLabel ?? base}/{quoteLabel ?? quote}
          </>
        )}
      </Typography>
    </Box>
  );
};

export default CryptoPairEntity;
