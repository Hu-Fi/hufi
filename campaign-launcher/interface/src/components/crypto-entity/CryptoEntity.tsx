import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { TOKENS } from '../../constants';

export type CryptoEntityProps = {
  name: string;
  displayName?: string;
  logo?: string;
};

export const CryptoEntity: FC<CryptoEntityProps> = ({
  name,
  displayName,
  logo,
}) => {
  const { icon, label } = TOKENS.find(
    (token) => token.name.toLowerCase() === name.toLowerCase()
  ) || {
    icon: logo,
    label: displayName ?? name,
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {icon && <img src={icon} alt={name} width={24} />}
      <Typography
        color="primary"
        variant="body2"
        sx={{ textTransform: 'capitalize' }}
      >
        {label ?? displayName ?? name}
      </Typography>
    </Box>
  );
};
