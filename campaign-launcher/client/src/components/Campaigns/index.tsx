import { type FC, useEffect, useState } from 'react';

import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import ActiveCampaignsFilter from '@/components/ActiveCampaignsFilter';
import AllCampaigns from '@/components/AllCampaigns';
import CampaignsViewDropdown from '@/components/CampaignsViewDropdown';
import JoinedCampaigns from '@/components/JoinedCampaigns';
import MyCampaigns from '@/components/MyCampaigns';
import { CampaignsView } from '@/types';

const Campaigns: FC = () => {
  const [showActiveCampaigns, setShowActiveCampaigns] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaignsView, setCampaignsView] = useState(() => {
    if (searchParams.size === 0) {
      return CampaignsView.ALL;
    }

    const view = searchParams.get('view');
    if (view === CampaignsView.JOINED) {
      return CampaignsView.JOINED;
    }

    return CampaignsView.ALL;
  });

  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('view');
      setSearchParams(newSearchParams);
    }
  }, [campaignsView, searchParams, setSearchParams]);

  const handleCampaignsViewChange = (view: CampaignsView) => {
    setCampaignsView(view);
  };

  const handleActiveCampaignsChange = (checked: boolean) => {
    setShowActiveCampaigns(checked);
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap={{ xs: 'wrap', md: 'nowrap' }}
      >
        <CampaignsViewDropdown
          campaignsView={campaignsView}
          onChange={handleCampaignsViewChange}
        />
        <ActiveCampaignsFilter
          checked={showActiveCampaigns}
          onChange={handleActiveCampaignsChange}
        />
      </Box>
      {campaignsView === CampaignsView.ALL && (
        <AllCampaigns showOnlyActiveCampaigns={showActiveCampaigns} />
      )}
      {campaignsView === CampaignsView.JOINED && (
        <JoinedCampaigns showOnlyActiveCampaigns={showActiveCampaigns} />
      )}
      {campaignsView === CampaignsView.MY && (
        <MyCampaigns showOnlyActiveCampaigns={showActiveCampaigns} />
      )}
    </Box>
  );
};

export default Campaigns;
