import { FC } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { CalendarIcon } from '../../icons';
import { CampaignDetails } from '../../types';
import { getChainIcon, getNetworkName, mapStatusToColor } from '../../utils';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  let hours = date.getHours().toString();
  if (+hours < 10) {
    hours = '0' + hours;
  }
  let minutes = date.getMinutes().toString();
  if (+minutes < 10) {
    minutes = '0' + minutes;
  }
  const tzOffset = date.getTimezoneOffset();
  const sign = tzOffset > 0 ? '-' : '+';
  const tzHours = Math.floor(Math.abs(tzOffset) / 60);
  return `${hours}:${minutes} GMT${sign}${tzHours}`;
};

type Props = {
  campaign: CampaignDetails;
};

const CampaignInfo: FC<Props> = ({ campaign }) => {
  const isCompleted = campaign.status === 'completed';
  return (
    <Box display="flex" alignItems="center" gap={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={0.5}
        px="10px"
        color={isCompleted ? "text.primary" : "primary.contrast"}
        bgcolor={mapStatusToColor(campaign.status, campaign.start_date, campaign.end_date)}
        fontSize="13px"
        fontWeight={600}
        borderRadius="4px"
        textTransform="capitalize"
      >
        {campaign.status}
      </Box>
      <Tooltip title={getNetworkName(campaign.chain_id) || "Unknown Network"} placement="top">
        <Box display="flex" sx={{ cursor: 'pointer' }}>
          {getChainIcon(campaign.chain_id)}
        </Box>
      </Tooltip>
      <Box display="flex" alignItems="center" gap={1}>
        {campaign?.start_date && campaign?.end_date && (
          <>
            <CalendarIcon />
            <Tooltip placement="top" title={formatTime(campaign.start_date)}>
              <Typography variant="subtitle2" borderBottom="1px dashed" sx={{ cursor: 'pointer' }}>
                {formatDate(campaign.start_date)}
              </Typography>
            </Tooltip>
            <Typography component="span" variant="subtitle2">-</Typography>
            <Tooltip placement="top" title={formatTime(campaign.end_date)}>
              <Typography variant="subtitle2" borderBottom="1px dashed" sx={{ cursor: 'pointer' }}>
                {formatDate(campaign.end_date)}
              </Typography>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CampaignInfo;
