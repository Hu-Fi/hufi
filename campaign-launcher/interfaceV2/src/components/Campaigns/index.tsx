import { FC, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress } from '@mui/material';
import { useChainId } from 'wagmi';

import { useGetJoinedCampaigns } from '../../hooks/recording-oracle/campaign';
import { useCampaigns, useMyCampaigns } from '../../hooks/useCampaigns';
import usePagination from '../../hooks/usePagination';
import { useActiveAccount } from '../../providers/ActiveAccountProvider';
import { CampaignStatus, CampaignsView } from '../../types';
import ActiveCampaignsFilter from '../ActiveCampaignsFilter';
import CampaignsTable from '../CampaignsTable';
import CampaignsTablePagination from '../CampaignsTablePagination';
import CampaignsViewDropdown from '../CampaignsViewDropdown';

const Campaigns: FC = () => {
  const [campaignsView, setCampaignsView] = useState(CampaignsView.ALL);
  const [showActiveCampaigns, setShowActiveCampaigns] = useState(false);
  const chainId = useChainId();
  const { activeAddress } = useActiveAccount();
  const { params, pagination, setPage, setPageSize, setNextPage, setPrevPage } = usePagination();
  const { limit, skip } = params;
  const { page, pageSize } = pagination;

  const { data: allCampaigns, isLoading: isAllCampaignsLoading } = useCampaigns(
    {
      chain_id: chainId,
      status: showActiveCampaigns ? CampaignStatus.ACTIVE : undefined,
      limit,
      skip,
    },
    campaignsView === CampaignsView.ALL
  );
  const { data: joinedCampaigns, isLoading: isJoinedCampaignsLoading } = useGetJoinedCampaigns(
    {
      status: showActiveCampaigns ? CampaignStatus.ACTIVE : undefined,
      limit,
      skip,
    },
    campaignsView === CampaignsView.JOINED
  );
  const { data: myCampaigns, isLoading: isMyCampaignsLoading } = useMyCampaigns(
    {
      chain_id: chainId,
      launcher: activeAddress,
      status: showActiveCampaigns ? CampaignStatus.ACTIVE : undefined, 
      limit,
      skip,
    },
    campaignsView === CampaignsView.MY
  );

  useEffect(() => {
    setPage(0);
  }, [campaignsView]);

  const data = useMemo(() => {
    if (campaignsView === CampaignsView.ALL) {
      return allCampaigns;
    }
    if (campaignsView === CampaignsView.JOINED) {
      return joinedCampaigns;
    }
    if (campaignsView === CampaignsView.MY) {
      return myCampaigns;
    }
  }, [campaignsView, allCampaigns, joinedCampaigns, myCampaigns]);

  const isLoading = isAllCampaignsLoading || isJoinedCampaignsLoading || isMyCampaignsLoading;

  const handleCampaignsViewChange = (view: CampaignsView) => {
    setCampaignsView(view);
  };

  const handleActiveCampaignsChange = (checked: boolean) => {
    setShowActiveCampaigns(checked);
  };

  return (
    <Box component="section" display="flex" flexDirection="column" gap={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
        <CampaignsViewDropdown campaignsView={campaignsView} onChange={handleCampaignsViewChange} />
        {campaignsView !== CampaignsView.JOINED && <ActiveCampaignsFilter checked={showActiveCampaigns} onChange={handleActiveCampaignsChange} />}
      </Box>
      {isLoading && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {!isLoading && (
        <>
          <CampaignsTable 
            data={data?.results} 
            isJoinedCampaigns={campaignsView === CampaignsView.JOINED} 
            isMyCampaigns={campaignsView === CampaignsView.MY} 
          />
          <CampaignsTablePagination 
            page={page}
            resultsLength={data?.results?.length || 0}
            hasMore={data?.has_more} 
            pageSize={pageSize} 
            setPageSize={setPageSize} 
            setNextPage={setNextPage} 
            setPrevPage={setPrevPage} 
          />
        </>
      )}
    </Box>
  );
};

export default Campaigns;