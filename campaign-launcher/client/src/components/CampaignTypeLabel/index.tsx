import type { FC } from 'react';

import { Chip } from '@mui/material';

import type { CampaignType } from '@/types';
import { mapTypeToLabel } from '@/utils';

type Props = {
  campaignType: CampaignType;
};

const CampaignTypeLabel: FC<Props> = ({ campaignType }) => {
  return (
    <Chip
      label={mapTypeToLabel(campaignType)}
      color="secondary"
      size="medium"
      sx={{
        height: 36,
        borderRadius: '200px',
        '& > .MuiChip-label': {
          py: 0,
          px: 2,
          color: 'secondary.contrast',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: '24px',
          letterSpacing: '0.1px',
        },
      }}
    />
  );
};

export default CampaignTypeLabel;
