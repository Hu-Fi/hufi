import { FC } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';

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
  const { address } = useAccount();
  const navigate = useNavigate();
  const isXl = useIsXlDesktop();
  const chain_id = useChainId();

  const { data, isLoading } = useMyCampaigns(
    {
      chain_id,
      launcher: address,
    }
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
        {data && data.results.length > 0 && <LaunchCampaign variant="contained" />}
      </Box>
      {isLoading && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {!isLoading && (
        <CampaignsTable
          data={data?.results || []}
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
