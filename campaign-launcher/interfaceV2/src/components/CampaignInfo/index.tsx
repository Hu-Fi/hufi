import { FC } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { CampaignDataDto } from '../../api/client';
import { CalendarIcon } from '../../icons';
import JoinCampaign from '../JoinCampaign';

const formatDate = (block: number): string => {
  const date = new Date(block * 1000);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

type Props = {
  campaign: CampaignDataDto | undefined;
  isCampaignLoading: boolean;
};

const CampaignInfo: FC<Props> = ({ campaign, isCampaignLoading }) => {
  const isActiveCampaign =
    campaign?.status === 'Pending' || campaign?.status === 'Partial';

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
        width="185px"
        py={1}
        ml={{ xs: 0, md: 2 }}
        color="primary.contrast"
        bgcolor={isActiveCampaign ? 'success.main' : 'error.main'}
        fontSize="15px"
        fontWeight={600}
        borderRadius="4px"
      >
        {isActiveCampaign ? 'Active' : campaign?.status}
      </Box>
      <Box display="flex" alignItems="center" gap={1} ml={{ xs: 0, md: 2 }}>
        {campaign?.startBlock && campaign?.endBlock && (
          <>
            <CalendarIcon />
            <Typography variant="subtitle2" color="text.primary">
              {`${formatDate(campaign.startBlock)} - ${formatDate(
                campaign.endBlock
              )}`}
            </Typography>
          </>
        )}
      </Box>
      <JoinCampaign campaign={campaign}  />
    </>
  );
};

export default CampaignInfo;
