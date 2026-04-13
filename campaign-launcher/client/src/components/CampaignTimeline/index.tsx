import { type FC } from 'react';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { CampaignStatus, type Campaign } from '@/types';

type Props = {
  campaign: Campaign;
  direction?: 'row' | 'column';
};

const DATE_FORMAT = 'Do MMM YYYY';

const getTimelineInfo = (campaign: Campaign | null | undefined) => {
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

  if (endDate.isBefore(nowDate)) {
    if (campaign.status === CampaignStatus.CANCELLED) {
      return {
        label: 'Cancelled on',
        value: endDate.format(DATE_FORMAT),
        color: '#ff6262',
      };
    }

    return {
      label: 'Ended on',
      value: endDate.format(DATE_FORMAT),
      color: '#d4cfff',
    };
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
      display="flex"
      alignItems={isRow ? 'center' : 'flex-start'}
      flexDirection={direction}
    >
      <Typography
        variant="caption"
        fontSize={14}
        color="text.secondary"
        letterSpacing="0.15px"
        mr={isRow ? 1 : 0}
      >
        {timeline.label}
      </Typography>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Box
          width={6}
          height={6}
          bgcolor={timeline.color}
          borderRadius="50%"
          border="3px solid"
          borderColor={timeline.color}
        />
        <Typography
          color={timeline.color}
          fontSize={14}
          fontWeight={700}
          lineHeight="150%"
          letterSpacing="0.15px"
        >
          {timeline.value}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignTimeline;
