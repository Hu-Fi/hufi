import { useState } from 'react';

import { Box, Typography, Select, MenuItem, FormControl, Skeleton } from '@mui/material';

import { useGetTotalVolume } from '../../hooks/recording-oracle/stats';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { StatsCard, Value } from '../DashboardStats';
import FormattedNumber from '../FormattedNumber';

const TotalVolume = () => {
  const [exchange, setExchange] = useState('');
  const { exchanges, isLoading: isExchangesLoading } = useExchangesContext();
  const { data: totalVolume, isLoading } = useGetTotalVolume(exchange || '');

  return (
    <StatsCard>
      <Box display="flex" alignItems="center" gap={{ xs: 1, lg: 4, xl: 8 }}>
        <Typography variant="subtitle2">Liquidity Provided</Typography>
        <FormControl variant="standard" sx={{ flex: 1 }}>
          <Select
            id="exchange-volume-select"
            value={exchange}
            displayEmpty
            disabled={isExchangesLoading}
            onChange={(e) => setExchange(e.target.value)}
            label="Exchange"
            slotProps={{
              input: {
                id: 'exchange-volume',
                sx: {
                  py: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                },
              },
            }}
            MenuProps={{
              PaperProps: {
                elevation: 4,
                sx: {
                  bgcolor: 'background.default',
                },
              },
            }}
          >
            <MenuItem value="">All Exchanges</MenuItem>
            {exchanges?.map(({ name, display_name }) => (
              <MenuItem key={name} value={name}>
                {display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Value>
        {isLoading ? (
          <Skeleton variant="text" sx={{ fontSize: '40px' }} />
        ) : (
          <FormattedNumber value={totalVolume} prefix="$" />
        )}
      </Value>
    </StatsCard>
  );
};

export default TotalVolume;
