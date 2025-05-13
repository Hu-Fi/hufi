import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { useMyCampaigns } from '../../hooks/useCampaigns';
import CampaignsTable from '../CampaignsTable';
import LaunchCampaign from '../LaunchCampaign';

type Props = {
  showPagination?: boolean;
  showAllCampaigns?: boolean;
};

const MyCampaigns: FC<Props> = ({
  showPagination = false,
  showAllCampaigns = true,
}) => {
  const { isConnected, address, chain } = useAccount();
  const navigate = useNavigate();

  const { data: campaigns, isPending } = useMyCampaigns(
    chain?.id as ChainId,
    address?.toLowerCase()
  );

  const isCampaignsExist = campaigns && campaigns.length > 0;

  const onViewAllClick = () => {
    navigate('/my-campaigns');
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Box component="section" display="flex" flexDirection="column" gap={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant="h5" color="text.primary">
          My Campaigns
        </Typography>
        {isCampaignsExist && <LaunchCampaign variant="contained" />}
      </Box>
      {isPending && <CircularProgress sx={{ width: '40px', height: '40px' }} />}
      {!isPending && !isCampaignsExist && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={5}
          py="20px"
          px={{ xs: 2, md: 0 }}
          bgcolor="background.default"
          borderRadius="16px"
          border="1px solid"
          borderColor="divider"
        >
          <Typography component="p" variant="subtitle2" color="text.secondary">
            At the moment you are not running any campaign.
          </Typography>
          <LaunchCampaign variant="contained" />
        </Box>
      )}
      {isCampaignsExist && (
        <CampaignsTable
          data={campaigns}
          showPagination={showPagination}
          showAllCampaigns={showAllCampaigns}
          onViewAllClick={onViewAllClick}
        />
      )}
    </Box>
  );
};

export default MyCampaigns;
