import type { FC } from 'react';

import { FormControlLabel, Switch } from '@mui/material';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const ActiveCampaignsFilter: FC<Props> = ({ checked, onChange }) => {
  return (
    <FormControlLabel
      control={
        <Switch
          size="medium"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label="Show only active campaigns"
      labelPlacement="start"
      sx={{
        height: '32px',
        m: 0,
      }}
      slotProps={{
        typography: {
          variant: 'body2',
        },
      }}
    />
  );
};

export default ActiveCampaignsFilter;
