import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
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
  const { address, chain } = useAccount();
  const navigate = useNavigate();
  const isXl = useIsXlDesktop();

  const { data: campaigns, isLoading } = useMyCampaigns(
    chain?.id as ChainId,
    address?.toLowerCase(),
  );

  const onViewAllClick = () => {
    navigate('/my-campaigns');
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant={isXl ? 'h5' : 'h6'} color="text.primary">
          My Campaigns
        </Typography>
        {campaigns && campaigns.length > 0 && <LaunchCampaign variant="contained" />}
      </Box>
      {isLoading && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {!isLoading && (
        <CampaignsTable
          data={campaigns}
          showPagination={showPagination}
          showAllCampaigns={showAllCampaigns}
          onViewAllClick={onViewAllClick}
          isMyCampaigns={true}
        />
      )}
    </Box>
  );
};

export default MyCampaigns;
