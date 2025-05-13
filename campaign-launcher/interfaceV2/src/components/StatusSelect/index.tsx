import { FC } from 'react';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const statuses = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'Active',
    value: 'Pending',
  },
  {
    label: 'Running',
    value: 'Running',
  },
  {
    label: 'Completed',
    value: 'Complete',
  },
] as const;

type Props = {
  onChange: (status: string) => void;
};

const StatusSelect: FC<Props> = ({ onChange }) => {
  return (
    <FormControl variant="standard" sx={{ minWidth: 256 }}>
      <InputLabel id="status-select-label">Sort by Status</InputLabel>
      <Select
        labelId="status-select-label"
        id="status-select"
        defaultValue="all"
        label="Sort by Status"
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
        {statuses.map((status) => (
          <MenuItem value={status.value} key={status.value}>
            {status.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StatusSelect;
