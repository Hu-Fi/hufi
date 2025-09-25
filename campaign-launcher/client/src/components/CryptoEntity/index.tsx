import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { getTokenInfo } from '../../utils';

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
  const { icon, label } = getTokenInfo(name);
  const entityIcon = icon || logo;
  
  return (
    <Box display="flex" alignItems="center" gap={1}>
      {entityIcon && <img src={entityIcon} alt={name} width={24} />}
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
