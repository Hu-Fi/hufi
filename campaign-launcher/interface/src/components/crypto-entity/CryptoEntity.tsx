import { FC } from 'react';

import { Box, Typography } from '@mui/material';
import { Address } from 'viem';

import { EXCHANGES, TOKENS } from '../../constants';
import { ExchangeName, TokenName } from '../../types';

export type CryptoEntityProps = {
  name: ExchangeName | TokenName | Address;
};

export const CryptoEntity: FC<CryptoEntityProps> = ({ name }) => {
  const { label, icon } =
    [...EXCHANGES, ...TOKENS].find(
      (exchangeOrToken) => exchangeOrToken.name === name
    ) || {};

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {icon && <img src={icon} alt={name} width={24} />}
      <Typography color="primary" variant="body2">
        {label ?? '-'}
      </Typography>
    </Box>
  );
};
