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
    };
  }
  const nowDate = dayjs();
  const startDate = dayjs(campaign.start_date);
  const endDate = dayjs(campaign.end_date);

  if (
    campaign.status === CampaignStatus.CANCELLED &&
    campaign.cancellation_requested_at
  ) {
    const cancellationDate = dayjs(campaign.cancellation_requested_at);
    return {
      label: 'Cancelled on',
      value: cancellationDate.format(DATE_FORMAT),
      color: '#ff6262',
    };
  }

  if (endDate.isBefore(nowDate)) {
    if (campaign.status === CampaignStatus.ACTIVE) {
      return {
        label: '',
        value: 'Waiting for payouts',
        color: '#5596ff',
      };
    }
    if (campaign.status === CampaignStatus.TO_CANCEL) {
      return {
        label: '',
        value: 'Pending cancellation',
        color: '#da4c4f',
      };
    }
    if (campaign.status === CampaignStatus.COMPLETED) {
      return {
        label: 'Ended on',
        value: endDate.format(DATE_FORMAT),
        color: '#d4cfff',
      };
    }
  }

  if (nowDate.isBefore(startDate)) {
    return {
      label: 'Starts on',
      value: startDate.format(DATE_FORMAT),
      color: '#43ba96',
    };
  }

  return {
    label: 'Ends on',
    value: endDate.format(DATE_FORMAT),
    color: '#b98c08',
  };
};

const CampaignTimeline: FC<Props> = ({ campaign, direction = 'row' }) => {
  const timeline = getTimelineInfo(campaign);
  const isRow = direction === 'row';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: isRow ? 'center' : 'flex-start',
        flexDirection: direction,
      }}
    >
      {timeline.label && (
        <>
          <Box
            sx={{
              display: isRow ? 'flex' : 'none',
              width: 4,
              height: 4,
              mr: 1,
              borderRadius: '50%',
              bgcolor: 'text.secondary',
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 14,
              letterSpacing: '0.15px',
              mr: isRow ? 1 : 0,
            }}
          >
            {timeline.label}
          </Typography>
        </>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            bgcolor: timeline.color,
            borderRadius: '50%',
            border: '3px solid',
            borderColor: timeline.color,
          }}
        />
        <Typography
          sx={{
            color: timeline.color,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: '150%',
            letterSpacing: '0.15px',
          }}
        >
          {timeline.value}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignTimeline;
