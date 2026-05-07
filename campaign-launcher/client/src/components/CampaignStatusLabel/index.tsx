import { type FC } from 'react';

import { Box, Typography } from '@mui/material';

import { type Campaign, CampaignStatus } from '@/types';

const mapStatusToColorAndText = (
  status: Campaign['status'],
  startDate: string,
  endDate: string
) => {
  const now = new Date().toISOString();

  switch (status) {
    case CampaignStatus.ACTIVE:
      if (now < startDate) {
        return {
          color: '#b78608',
          text: 'Awaiting start date',
        };
      } else if (now > endDate) {
        return {
          color: '#5596ff',
          text: 'Waiting for payouts',
        };
      } else {
        return {
          color: '#1a926e',
          text: 'Active',
        };
      }
    case CampaignStatus.COMPLETED:
      return {
        color: '#d4cfff',
        text: 'Ended',
      };
    case CampaignStatus.CANCELLED:
      return {
        color: '#da4c4f',
        text: 'Cancelled',
      };
    case CampaignStatus.TO_CANCEL:
      return {
        color: '#da4c4f',
        text: 'Pending cancellation',
      };
    default:
      return {
        color: '#d4cfff',
        text: 'Unknown',
      };
  }
};

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
  const { color, text } = mapStatusToColorAndText(
    campaignStatus,
    startDate,
    endDate
  );
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, md: 1 },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          p: { xs: '4px', md: '6px' },
          borderRadius: '100%',
          bgcolor: color,
        }}
      />
      <Typography
        sx={{
          color,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '150%',
          textTransform: 'capitalize',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default CampaignStatusLabel;
