import { useMemo, useState, type FC } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useIsFetching } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useConnection } from 'wagmi';

import AllCampaigns from '@/components/AllCampaigns';
import CampaignsFilters, {
  type CampaignsFiltersSelection,
} from '@/components/CampaignsFilters';
import CampaignsTabs from '@/components/CampaignsTabs';
import CampaignsViewToggle from '@/components/CampaignsViewToggle';
import HistoryFilters from '@/components/HistoryFilters';
import HostedCampaigns from '@/components/HostedCampaigns';
import JoinedCampaigns from '@/components/JoinedCampaigns';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import MobileBottomNav from '@/components/MobileBottomNav';
import PageWrapper from '@/components/PageWrapper';
import { ROUTES, PERSISTED_CAMPAIGNS_VIEW_KEY } from '@/constants';
import { AUTHED_QUERY_TAG, QUERY_KEYS } from '@/constants/queryKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import usePagination from '@/hooks/usePagination';
import { ApiKeyIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import {
  type CampaignsQueryParams,
  CampaignStatus,
  HistoryViewFilter,
  CampaignsTabFilter as TabFilter,
} from '@/types';
import { filterFalsyQueryParams } from '@/utils';

const Campaigns: FC = () => {
  const { appChainId } = useNetwork();
  const [view, setView] = useState<'grid' | 'table'>(() => {
    const persistedView = localStorage.getItem(PERSISTED_CAMPAIGNS_VIEW_KEY);
    return persistedView === 'table' ? 'table' : 'grid';
  });
  const [tabFilter, setTabFilter] = useState<TabFilter>(TabFilter.ACTIVE);
  const [historyViewFilter, setHistoryViewFilter] = useState<HistoryViewFilter>(
    HistoryViewFilter.ALL
  );
  const [appliedFilters, setAppliedFilters] =
    useState<CampaignsFiltersSelection>({
      campaignTypes: [],
      exchanges: [],
      network: appChainId,
    });

  const navigate = useNavigate();
  const { isConnected } = useConnection();
  const { isAuthenticated } = useWeb3Auth();
  const { activeAddress } = useActiveAccount();
  const {
    params: { limit, skip },
    resetPage,
    setNextPage,
  } = usePagination();

  const isMobile = useIsMobile();
  useReserveLayoutBottomOffset(isMobile);

  const isGridView = view === 'grid';

  const statusFilter = useMemo(() => {
    if (tabFilter === TabFilter.HISTORY) {
      return [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED];
    }
    return [CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL];
  }, [tabFilter]);

  const launcherFilter = useMemo(() => {
    if (
      tabFilter === TabFilter.HOSTED ||
      (tabFilter === TabFilter.HISTORY &&
        historyViewFilter === HistoryViewFilter.HOSTED)
    ) {
      return activeAddress;
    }
    return undefined;
  }, [tabFilter, historyViewFilter, activeAddress]);

  const selectedCampaignTypes = appliedFilters.campaignTypes.filter(
    (campaignType) => campaignType !== 'all'
  );
  const selectedExchanges = appliedFilters.exchanges.filter(
    (exchange) => exchange !== 'all'
  );

  const queryParams = filterFalsyQueryParams({
    chain_id: appliedFilters.network,
    status: statusFilter,
    launcher: launcherFilter,
    type: selectedCampaignTypes,
    exchange: selectedExchanges,
    limit,
    skip,
  }) as CampaignsQueryParams;

  const filtersCount = useMemo(() => {
    let count = 0;
    Object.entries(appliedFilters)
      .filter(([key]) => key !== 'network')
      .forEach(([_, value]) => {
        if (Array.isArray(value)) {
          count += Number(value.length > 0);
        } else {
          count += Number(!!value);
        }
      });
    return count;
  }, [appliedFilters]);

  const isJoinedTab =
    tabFilter === TabFilter.JOINED ||
    (tabFilter === TabFilter.HISTORY &&
      historyViewFilter === HistoryViewFilter.JOINED);

  const isHostedTab =
    tabFilter === TabFilter.HOSTED ||
    (tabFilter === TabFilter.HISTORY &&
      historyViewFilter === HistoryViewFilter.HOSTED);

  const isAllTab = !isJoinedTab && !isHostedTab;

  const commonKeys = [
    appliedFilters.network,
    statusFilter,
    selectedCampaignTypes,
    selectedExchanges,
    limit,
    skip,
  ];
  const activeKey = isJoinedTab
    ? [
        QUERY_KEYS.JOINED_CAMPAIGNS,
        isAuthenticated,
        ...commonKeys,
        AUTHED_QUERY_TAG,
      ]
    : isHostedTab
      ? [QUERY_KEYS.HOSTED_CAMPAIGNS, launcherFilter, ...commonKeys]
      : [QUERY_KEYS.ALL_CAMPAIGNS, ...commonKeys];

  const isFetchingCount = useIsFetching({ queryKey: activeKey });

  const disableFilters = isFetchingCount > 0;

  const handleSetTabFilter = (nextTab: TabFilter) => {
    resetPage();
    setTabFilter(nextTab);
  };

  const handleSetHistoryViewFilter = (nextFilter: HistoryViewFilter) => {
    resetPage();
    setHistoryViewFilter(nextFilter);
  };

  const handleApplyFilters = (nextFilters: CampaignsFiltersSelection) => {
    resetPage();
    setAppliedFilters(nextFilters);
  };

  const handleChangeView = (nextView: 'grid' | 'table') => {
    setView(nextView);
    localStorage.setItem(PERSISTED_CAMPAIGNS_VIEW_KEY, nextView);
  };

  return (
    <PageWrapper>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          mb: { xs: 4, md: 6 },
          mx: { xs: -2, md: 0 },
          pb: { xs: 3, md: 0 },
          px: { xs: 2, md: 0 },
          gap: { xs: 3, md: 4 },
          borderBottom: { xs: '1px solid #473c74', md: 'none' },
        }}
      >
        <Stack>
          <Typography
            variant={isMobile ? 'h5' : 'h3'}
            sx={{
              color: 'white',
              fontWeight: isMobile ? 600 : 800,
              mb: { xs: 0.5, md: 1.5 },
              letterSpacing: isMobile ? '0px' : '-1.5px',
            }}
          >
            Campaigns
          </Typography>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 400,
              color: '#6b6490',
            }}
          >
            Join or host trading campaigns to earn rewards.
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
          }}
        >
          {isConnected && (
            <LaunchCampaignButton size={isMobile ? 'medium' : 'large'} />
          )}
          {isAuthenticated && (
            <Button
              variant="outlined"
              size={isMobile ? 'medium' : 'large'}
              color="error"
              sx={{ color: 'white' }}
              onClick={() => navigate(ROUTES.MANAGE_API_KEYS)}
              startIcon={<ApiKeyIcon />}
            >
              Manage API Keys
            </Button>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            minWidth: 0,
            gap: 1.5,
          }}
        >
          <CampaignsTabs
            activeTab={tabFilter}
            setActiveTab={handleSetTabFilter}
            isDisabled={disableFilters}
          />
          <CampaignsFilters
            appliedFilters={appliedFilters}
            filtersCount={filtersCount}
            handleApplyFilters={handleApplyFilters}
            isDisabled={disableFilters}
          />
        </Box>
        <CampaignsViewToggle
          isGridView={isGridView}
          disableFilters={disableFilters}
          onViewChange={handleChangeView}
        />
      </Box>
      {tabFilter === TabFilter.HISTORY && (
        <HistoryFilters
          selectedFilter={historyViewFilter}
          setSelectedFilter={handleSetHistoryViewFilter}
          isDisabled={disableFilters}
        />
      )}
      {isJoinedTab && (
        <JoinedCampaigns
          queryParams={queryParams}
          isGridView={isGridView}
          setNextPage={setNextPage}
          hasActiveFilters={filtersCount > 0}
          isHistory={tabFilter === TabFilter.HISTORY}
        />
      )}
      {isHostedTab && (
        <HostedCampaigns
          queryParams={queryParams}
          isGridView={isGridView}
          setNextPage={setNextPage}
          hasActiveFilters={filtersCount > 0}
          isHistory={tabFilter === TabFilter.HISTORY}
        />
      )}
      {isAllTab && (
        <AllCampaigns
          queryParams={queryParams}
          isGridView={isGridView}
          setNextPage={setNextPage}
          hasActiveFilters={filtersCount > 0}
          isHistory={tabFilter === TabFilter.HISTORY}
        />
      )}
      <MobileBottomNav isVisible={isMobile} />
    </PageWrapper>
  );
};

export default Campaigns;
