import { FC } from 'react';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { Exchange } from '../../types';

type Props = {
  data: Exchange[] | undefined;
  onChange: (exchange: string) => void;
};

const ExchangeSelect: FC<Props> = ({ data, onChange }) => {
  return (
    <FormControl 
      variant="standard" 
      sx={{ 
        width: { xs: '100%', md: 'auto' }, 
        minWidth: 256, 
        height: '48px', 
        order: { xs: 4, md: 3 } 
      }}
    >
      <InputLabel id="exchange-select-label">Sort by Exchange</InputLabel>
      <Select
        labelId="exchange-select-label"
        id="exchange-select"
        defaultValue="all"
        label="Sort by Exchange"
        sx={{
          '.MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            paddingY: '5px',
            minWidth: '300px',
          },
        }}
        MenuProps={{
          PaperProps: {
            elevation: 4,
            sx: {
              maxHeight: 300,
              bgcolor: 'background.default',
            },
          },
        }}
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="all">All</MenuItem>
        {data?.map((exchange) => (
          <MenuItem value={exchange.name} key={exchange.name}>
            {exchange.display_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ExchangeSelect;
