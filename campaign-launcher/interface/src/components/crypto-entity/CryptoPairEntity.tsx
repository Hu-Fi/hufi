import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { EXCHANGES, PAIRS, TOKENS } from '../../constants';

export type CryptoPairEntityProps = {
  symbol: string;
};

export const CryptoPairEntity: FC<CryptoPairEntityProps> = ({ symbol }) => {
  const pair = PAIRS.find(
    ({ symbol: pairSymbol }) =>
      pairSymbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!pair) {
    return '-';
  }

  const { base, quote } = pair;

  const { label: baseLabel, icon: baseIcon } =
    [...EXCHANGES, ...TOKENS].find(
      (exchangeOrToken) => exchangeOrToken.name === base
    ) || {};

  const { label: quoteLabel, icon: quoteIcon } =
    [...EXCHANGES, ...TOKENS].find(
      (exchangeOrToken) => exchangeOrToken.name === quote
    ) || {};

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {baseIcon && (
        <Box component="img" src={baseIcon} alt={baseLabel} width={24} />
      )}
      {quoteIcon && (
        <Box
          component="img"
          src={quoteIcon}
          alt={quoteLabel}
          width={24}
          marginLeft={-2}
        />
      )}
      <Typography color="primary" variant="body2">
        {baseLabel}/{quoteLabel}
      </Typography>
    </Box>
  );
};
