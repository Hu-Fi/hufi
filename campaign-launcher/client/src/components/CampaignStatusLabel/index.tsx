import { type FC } from 'react';

import { Chip } from '@mui/material';

import { CampaignStatus } from '@/types';
import { mapStatusToColor } from '@/utils';

type Props = {
  campaignStatus: CampaignStatus;
  startDate: string;
  endDate: string;
};

const CampaignStatusLabel: FC<Props> = ({
  campaignStatus,
  startDate,
  endDate,
}) => {
  const isCompleted = campaignStatus === CampaignStatus.COMPLETED;
  return (
    <Chip
      label={campaignStatus.split('_').join(' ')}
      color="secondary"
      size="medium"
      sx={{
        height: 36,
        py: '6px',
        bgcolor: mapStatusToColor(campaignStatus, startDate, endDate),
        textTransform: 'capitalize',
        borderRadius: '100px',
        '& > .MuiChip-label': {
          py: 0,
          px: 2,
          color: isCompleted ? 'secondary.contrast' : 'primary.contrast',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: '24px',
          letterSpacing: '0.1px',
        },
      }}
    />
  );
};

export default CampaignStatusLabel;
