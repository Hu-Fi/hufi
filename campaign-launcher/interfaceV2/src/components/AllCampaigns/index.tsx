import { FC, useState } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { useCampaigns } from '../../hooks/useCampaigns';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import CampaignsTable from '../CampaignsTable';
import ExchangeSelect from '../ExchangeSelect';
import LaunchCampaign from '../LaunchCampaign';
import StatusSelect from '../StatusSelect';

type Props = {
  showPagination?: boolean;
  showAllCampaigns?: boolean;
};

const AllCampaigns: FC<Props> = ({
  showPagination = false,
  showAllCampaigns = true,
}) => {
  const [status, setStatus] = useState('all');
  const [exchange, setExchange] = useState('all');
  const { exchanges } = useExchangesContext();
  const { chain } = useAccount();
  const navigate = useNavigate();

  const { data: campaigns, isPending } = useCampaigns(
    chain?.id as ChainId,
    status,
    exchange
  );

  const isCampaignsExist = campaigns && campaigns.length > 0;

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const handleExchangeChange = (value: string) => {
    setExchange(value);
  };

  const onViewAllClick = () => {
    navigate('/all-campaigns');
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box display="flex" alignItems="center" gap={6}>
        <Typography component="h3" variant="h5" color="text.primary">
          All Campaigns
        </Typography>
        <Box display="flex" alignItems="center" gap={6}>
          <StatusSelect onChange={handleStatusChange} />
          <ExchangeSelect data={exchanges} onChange={handleExchangeChange} />
        </Box>
        <LaunchCampaign variant="contained" sx={{ ml: 'auto' }} />
      </Box>
      {isPending && <CircularProgress sx={{ width: '40px', height: '40px' }} />}
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

export default AllCampaigns;
