import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { useMyCampaigns } from '../../hooks/useCampaigns';
import CampaignsTable from '../CampaignsTable';

// TODO: replace with a separate component
const LaunchCampaignButton: FC = () => {
  return (
    <Button
      variant="contained"
      size="medium"
      sx={{ color: 'primary.contrast', fontWeight: 600 }}
    >
      Launch Campaign
    </Button>
  );
};

const MyCampaigns: FC = () => {
  const { isConnected, address } = useAccount();

  const { data: campaigns, isPending } = useMyCampaigns(
    ChainId.POLYGON,
    address?.toLowerCase()
  );

  const isCampaignsExist = !isPending && campaigns && campaigns.length > 0;

  if (!isConnected) {
    return null;
  }

  return (
    <Box component="section" display="flex" flexDirection="column" gap={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant="h5" color="text.primary">
          My Campaigns
        </Typography>
        {isCampaignsExist && <LaunchCampaignButton />}
      </Box>
      {isPending && <CircularProgress sx={{ width: '40px', height: '40px' }} />}
      {!isCampaignsExist && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={5}
          py="20px"
          bgcolor="background.default"
          borderRadius="16px"
          border="1px solid"
          borderColor="divider"
        >
          <Typography component="p" variant="subtitle2" color="text.secondary">
            At the moment you are not running any campaign.
          </Typography>
          <LaunchCampaignButton />
        </Box>
      )}
      {isCampaignsExist && <CampaignsTable data={campaigns} />}
    </Box>
  );
};

export default MyCampaigns;
