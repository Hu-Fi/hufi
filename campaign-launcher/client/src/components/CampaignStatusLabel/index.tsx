import { type FC } from 'react';

import { Box, Typography } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
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
          color: 'neutral.300',
          text: 'Awaiting start date',
        };
      } else if (now > endDate) {
        return {
          color: 'neutral.300',
          text: 'Waiting for payouts',
        };
      } else {
        return {
          color: 'neutral.200',
          text: 'Active',
        };
      }
    case CampaignStatus.COMPLETED:
      return {
        color: 'text.primary',
        text: 'Ended',
      };
    case CampaignStatus.CANCELLED:
      return {
        color: 'neutral.400',
        text: 'Cancelled',
      };
    case CampaignStatus.TO_CANCEL:
      return {
        color: 'neutral.400',
        text: 'Pending cancellation',
      };
    default:
      return {
        color: 'text.primary',
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
  const isMobile = useIsMobile();
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
        variant={isMobile ? 'body2' : 'body3'}
        sx={{
          color,
          textTransform: 'capitalize',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default CampaignStatusLabel;
