import { type FC } from 'react';

import { Box, Chip } from '@mui/material';

import { type Campaign, CampaignStatus } from '@/types';

// TODO: Add colors for each status
export const mapStatusToColors = (
  status: Campaign['status'],
  startDate: string,
  endDate: string
) => {
  const now = new Date().toISOString();

  switch (status) {
    case CampaignStatus.ACTIVE:
      if (now < startDate) {
        return {
          fontColor: '#1A926E',
          bgColor: '#1A2C36',
        };
      } else if (now > endDate) {
        return {
          fontColor: '#1A926E',
          bgColor: '#1A2C36',
        };
      } else {
        return {
          fontColor: '#1A926E',
          bgColor: '#1A2C36',
        };
      }
    case CampaignStatus.CANCELLED:
      return {
        fontColor: '#1A926E',
        bgColor: '#1A2C36',
      };
    case CampaignStatus.COMPLETED:
      return {
        fontColor: '#1A926E',
        bgColor: '#1A2C36',
      };
    case CampaignStatus.TO_CANCEL:
      return {
        fontColor: '#1A926E',
        bgColor: '#1A2C36',
      };
    default:
      return {
        fontColor: '#1A926E',
        bgColor: '#1A2C36',
      };
  }
};

type Props = {
  campaignStatus: CampaignStatus;
  startDate: string;
  endDate: string;
};

const CampaignStatusChip: FC<Props> = ({
  campaignStatus,
  startDate,
  endDate,
}) => {
  const { fontColor, bgColor } = mapStatusToColors(
    campaignStatus,
    startDate,
    endDate
  );
  return (
    <Chip
      label={
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            component="span"
            display="inline-flex"
            width="12px"
            height="12px"
            borderRadius="100%"
            bgcolor={fontColor}
          />
          {campaignStatus.split('_').join(' ')}
        </Box>
      }
      size="medium"
      sx={{
        height: 30,
        py: '6px',
        bgcolor: bgColor,
        textTransform: 'capitalize',
        borderRadius: '90px',
        border: '1px solid #433679',
        '& > .MuiChip-label': {
          py: 0,
          px: 2,
          color: fontColor,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '150%',
        },
      }}
    />
  );
};

export default CampaignStatusChip;
