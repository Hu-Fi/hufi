import { FC } from 'react';

import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';

import { CalendarIcon } from '../../icons';
import { CampaignDetails } from '../../types';
import { getChainIcon, getNetworkName, mapStatusToColor } from '../../utils';
import ExplorerLink from '../ExplorerLink';
import JoinCampaign from '../JoinCampaign';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

type Props = {
  campaign: CampaignDetails | undefined;
  isCampaignLoading: boolean;
};

const CampaignInfo: FC<Props> = ({ campaign, isCampaignLoading }) => {
  if (!campaign) {
    return null;
  }

  if (isCampaignLoading) {
    return <CircularProgress sx={{ width: '32px', height: '32px', ml: 3 }} />;
  }

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={0.5}
        px="10px"
        mx={{ xs: 0, md: 2 }}
        color="primary.contrast"
        bgcolor={mapStatusToColor(campaign.status, campaign.start_date, campaign.end_date)}
        fontSize="13px"
        fontWeight={600}
        borderRadius="4px"
        textTransform="capitalize"
      >
        {campaign.status}
      </Box>
      <ExplorerLink address={campaign.address} chainId={campaign.chain_id} />
      <Box display="flex" alignItems="center" gap={1} ml={{ xs: 0, md: 2 }}>
        {campaign?.start_date && campaign?.end_date && (
          <>
            <CalendarIcon />
            <Typography variant="subtitle2" color="text.primary">
              {`${formatDate(campaign.start_date)} - ${formatDate(
                campaign.end_date
              )}`}
            </Typography>
          </>
        )}
      </Box>
      <Tooltip title={getNetworkName(campaign.chain_id) || "Unknown Network"}>
        <Box display="flex" ml={2} sx={{ cursor: 'pointer' }}>
          {getChainIcon(campaign.chain_id)}
        </Box>
      </Tooltip>
      <JoinCampaign campaign={campaign} />
    </>
  );
};

export default CampaignInfo;
