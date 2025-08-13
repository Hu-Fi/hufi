import { useState } from 'react';

import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';

import { useGetTotalVolume } from '../../hooks/recording-oracle/stats';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { StatsCard, Value } from '../DashboardStats';

const TotalVolume = () => {
  const [exchange, setExchange] = useState('');
  const { exchanges, exchangesMap } = useExchangesContext();
  const { data: totalVolume } = useGetTotalVolume(exchange || '');

  return (
    <StatsCard>
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="subtitle2">Liquidity Provided</Typography>
        <FormControl variant="standard" sx={{ flex: 1 }}>
          <Select
            id="exchange-volume-select"
            value={exchange}
            displayEmpty
            onChange={(e) => setExchange(e.target.value)}
            label="Exchange"
            renderValue={(value) => {
              if (value.length === 0) {
                return 'Exchange';
              }
              return exchangesMap.get(value)?.display_name || '';
            }}
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
          >
            {exchanges?.map(({ name, display_name }) => (
              <MenuItem key={name} value={name}>
                {display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Value>${(Number(totalVolume) || 0)}</Value>
    </StatsCard>
  );
};

export default TotalVolume;
