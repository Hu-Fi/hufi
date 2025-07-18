import { FC } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
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
  const { chainId } = useAccount();
  const navigate = useNavigate();
  const { data: campaigns, isLoading } = useGetUserJoinedCampaigns(chainId);

  const onViewAllClick = () => {
    navigate('/joined-campaigns');
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant="h5" color="text.primary">
          Joined Campaigns
        </Typography>
      </Box>
      {isLoading && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {!isLoading && (
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
