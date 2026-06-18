import { type FC } from 'react';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { CampaignStatus, type JoinedCampaign, type Campaign } from '@/types';

type Props = {
  campaign: Campaign | JoinedCampaign;
  direction?: 'row' | 'column';
};

const DATE_FORMAT = 'Do MMM YYYY';

const getTimelineInfo = (
  campaign: Campaign | JoinedCampaign | null | undefined
) => {
  if (!campaign) {
    return {
      label: '',
      value: '',
      color: 'transparent',
      isPending: false,
    };
  }
  const nowDate = dayjs();
  const startDate = dayjs(campaign.start_date);
  const endDate = dayjs(campaign.end_date);

  if (campaign.status === CampaignStatus.CANCELLED) {
    const cancellationDate = dayjs(campaign.cancellation_requested_at);
    return {
      label: 'Cancelled on',
      value: cancellationDate.format(DATE_FORMAT),
      color: 'neutral.400',
      isPending: false,
    };
  }

  if (endDate.isBefore(nowDate)) {
    if (campaign.status === CampaignStatus.ACTIVE) {
      return {
        label: '',
        value: 'Waiting for payouts',
        color: 'neutral.300',
        isPending: true,
      };
    }
    if (campaign.status === CampaignStatus.TO_CANCEL) {
      return {
        label: '',
        value: 'Pending cancellation',
        color: 'neutral.400',
        isPending: true,
      };
    }
    if (campaign.status === CampaignStatus.COMPLETED) {
      return {
        label: 'Ended on',
        value: endDate.format(DATE_FORMAT),
        color: 'secondary.200',
        isPending: false,
      };
    }
  }

  if (nowDate.isBefore(startDate)) {
    return {
      label: 'Starts on',
      value: startDate.format(DATE_FORMAT),
      color: 'neutral.200',
      isPending: false,
    };
  }

  return {
    label: 'Ends on',
    value: endDate.format(DATE_FORMAT),
    color: 'neutral.300',
    isPending: false,
  };
};

const CampaignTimeline: FC<Props> = ({ campaign, direction = 'row' }) => {
  const timeline = getTimelineInfo(campaign);
  const isRow = direction === 'row';
  const { isPending, label, value, color } = timeline;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: isRow ? 'center' : 'flex-start',
        flexDirection: direction,
      }}
    >
      <Box
        sx={{
          display: isRow ? 'flex' : 'none',
          width: 4,
          height: 4,
          mr: 1,
          borderRadius: '50%',
          bgcolor: 'neutral.100',
          flexShrink: 0,
        }}
      />
      {label && (
        <Typography
          sx={{
            fontSize: 14,
            letterSpacing: '0.15px',
            mr: isRow ? 1 : 0,
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {isPending ? (
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'transparent',
              border: '1px dashed',
              borderColor: color,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 6,
              height: 6,
              bgcolor: color,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: color,
            }}
          />
        )}
        <Typography
          sx={{
            color,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: '150%',
            letterSpacing: '0.15px',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignTimeline;
