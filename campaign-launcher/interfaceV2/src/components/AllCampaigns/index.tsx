import { FC, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useChainId } from 'wagmi';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import CampaignsTable from '../CampaignsTable';
import ExchangeSelect from '../ExchangeSelect';
import LaunchCampaign from '../LaunchCampaign';

type Props = {
  showPagination?: boolean;
  showAllCampaigns?: boolean;
};

const AllCampaigns: FC<Props> = ({
  showPagination = false,
  showAllCampaigns = true,
}) => {
  const [exchange, setExchange] = useState('');
  const { exchanges } = useExchangesContext();
  const chainId = useChainId();
  const navigate = useNavigate();
  const isXl = useIsXlDesktop();

  const { data, isPending } = useCampaigns(
    {
      chain_id: chainId,
      status,
      exchange_name: exchange,
    }
  );

  const isCampaignsExist = data?.results && data.results.length > 0;

  const handleExchangeChange = (value: string) => {
    setExchange(value);
  };

  const onViewAllClick = () => {
    navigate('/all-campaigns');
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box display="flex" alignItems="center" gap={{ xs: 3, md: 6 }} flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
        <Typography component="h3" variant={isXl ? 'h5' : 'h6'} color="text.primary" order={{ xs: 1, md: 1 }}>
          All Campaigns
        </Typography>
        <ExchangeSelect data={exchanges} onChange={handleExchangeChange} />
        <LaunchCampaign variant="contained" sx={{ ml: { xs: 0, md:'auto' }, order: { xs: 2, md: 4 } }} />
      </Box>
      {isPending && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {isCampaignsExist && (
        <CampaignsTable
          data={data?.results}
          showPagination={showPagination}
          showAllCampaigns={showAllCampaigns}
          onViewAllClick={onViewAllClick}
        />
      )}
    </Box>
  );
};

export default AllCampaigns;
