import { FC } from 'react';

import { CircularProgress, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { useGetUserJoinedCampaigns } from '../../hooks/recording-oracle/campaign';
import CampaignsTable from '../CampaignsTable';

type Props = {
  showPagination?: boolean;
  showAllCampaigns?: boolean;
};

const JoinedCampaigns: FC<Props> = ({
  showPagination = false,
  showAllCampaigns = true,
}) => {
  const { isConnected, chainId } = useAccount();
  const navigate = useNavigate();
  const { data: campaigns, isPending } = useGetUserJoinedCampaigns(chainId);

  const isCampaignsExist = campaigns && campaigns.length > 0;

  const onViewAllClick = () => {
    navigate('/joined-campaigns');
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Box component="section" display="flex" flexDirection="column" gap={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant="h5" color="text.primary">
          Joined Campaigns
        </Typography>
      </Box>
      {isPending && (
        <CircularProgress
          sx={{ width: '40px', height: '40px', my: 3, mx: 'auto' }}
        />
      )}
      {!isPending && !isCampaignsExist && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={5}
          py="20px"
          px={{ xs: 2, md: 0 }}
          bgcolor="background.default"
          borderRadius="16px"
          border="1px solid"
          borderColor="divider"
          textAlign={{ xs: 'center', md: 'unset' }}
        >
          <Typography component="p" variant="subtitle2" color="text.secondary">
            At the moment you are not participating in any campaign, please see
            below running campaigns to participate.
          </Typography>
        </Box>
      )}
      {isCampaignsExist && (
        <CampaignsTable
          data={campaigns}
          showPagination={showPagination}
          showAllCampaigns={showAllCampaigns}
          isJoinedCampaigns={true}
          onViewAllClick={onViewAllClick}
        />
      )}
    </Box>
  );
};

export default JoinedCampaigns;
