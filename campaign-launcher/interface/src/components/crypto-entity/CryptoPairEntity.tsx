import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { TOKENS } from '../../constants';

export type CryptoPairEntityProps = {
  symbol: string;
};

export const CryptoPairEntity: FC<CryptoPairEntityProps> = ({ symbol }) => {
  const [base, quote] = symbol.split('/');

  const { icon: baseIcon, label: baseLabel } = TOKENS.find(
    (token) => token.name.toLowerCase() === base.toLowerCase()
  ) || { label: base };

  const { icon: quoteIcon, label: quoteLabel } = TOKENS.find(
    (token) => token.name.toLowerCase() === quote.toLowerCase()
  ) || { label: quote };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {baseIcon && quoteIcon && (
        <>
          <Box component="img" src={baseIcon} alt={baseLabel} width={24} />
          <Box
            component="img"
            src={quoteIcon}
            alt={quoteLabel}
            width={24}
            marginLeft={-2}
          />
        </>
      )}
      <Typography color="primary" variant="body2">
        {baseLabel ?? base}/{quoteLabel ?? quote}
      </Typography>
    </Box>
  );
};
