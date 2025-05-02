import { FC, useState } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, CircularProgress, Typography } from '@mui/material';

import { useCampaigns } from '../../hooks/useCampaigns';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import CampaignsTable from '../CampaignsTable';
import ExchangeSelect from '../ExchangeSelect';
import LaunchCampaign from '../LaunchCampaign';
import StatusSelect from '../StatusSelect';

const AllCampaigns: FC = () => {
  const [status, setStatus] = useState('all');
  const [exchange, setExchange] = useState('all');
  const { exchanges } = useExchangesContext();
  const { data: campaigns, isPending } = useCampaigns(
    ChainId.POLYGON,
    status,
    exchange
  );

  const isCampaignsExist = !isPending && campaigns && campaigns.length > 0;

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const handleExchangeChange = (value: string) => {
    setExchange(value);
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
      {isCampaignsExist && <CampaignsTable data={campaigns} withPagination />}
    </Box>
  );
};

export default AllCampaigns;
