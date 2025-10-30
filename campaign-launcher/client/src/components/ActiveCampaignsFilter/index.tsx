import type { FC } from 'react';

import { FormControlLabel, Switch } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const ActiveCampaignsFilter: FC<Props> = ({ checked, onChange }) => {
  const isMobile = useIsMobile();

  return (
    <FormControlLabel
      control={
        <Switch
          size="medium"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          color={isMobile ? 'secondary' : 'primary'}
        />
      }
      label={isMobile ? 'Active only' : 'Show only active campaigns'}
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
