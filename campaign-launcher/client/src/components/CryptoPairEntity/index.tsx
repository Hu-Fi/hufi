import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { getTokenInfo } from '../../utils';

export type CryptoPairEntityProps = {
  symbol: string;
  size?: 'small' | 'medium' | 'large';
};

const getStyles = (size: 'small' | 'medium' | 'large') => {
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
        width: 24,
        border: '1px solid white',
      };
  }
};

export const CryptoPairEntity: FC<CryptoPairEntityProps> = ({
  symbol,
  size = 'small',
}) => {
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
            {...getStyles(size).image}
          />
          <Box
            component="img"
            src={quoteIcon}
            alt={quoteLabel}
            marginLeft={isLarge ? -4 : -2}
            borderRadius="100%"
            {...getStyles(size).image}
          />
        </>
      )}
      <Typography color="primary" {...getStyles(size).text}>
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
