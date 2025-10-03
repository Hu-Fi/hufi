import { FC } from 'react';

import { Box, Typography } from '@mui/material';

import { getTokenInfo } from '../../utils';
import { getSymbolStyles } from '../CampaignSymbol';

type Props = {
  symbol: string;
  size?: 'small' | 'medium' | 'large';
};

export const CryptoEntity: FC<Props> = ({ symbol, size = 'small' }) => {
  const { icon, label } = getTokenInfo(symbol);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {icon && (
        <Box
          component="img"
          src={icon}
          alt={label}
          width={getSymbolStyles(size).image.width}
          border={getSymbolStyles(size).image.border}
          borderRadius="100%"
        />
      )}
      <Typography color="primary" {...getSymbolStyles(size).text}>
        {label}
      </Typography>
    </Box>
  );
};
