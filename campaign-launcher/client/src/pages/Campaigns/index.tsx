import { useMemo, useState, type FC } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { useConnection } from 'wagmi';

import CampaignsFeed from '@/components/CampaignsFeed';
import CampaignsFilters, {
  type CampaignsFiltersSelection,
} from '@/components/CampaignsFilters';
import CampaignsTabs from '@/components/CampaignsTabs';
import CampaignsViewToggle from '@/components/CampaignsViewToggle';
import HistoryFilters from '@/components/HistoryFilters';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import MobileBottomNav from '@/components/MobileBottomNav';
import PageWrapper from '@/components/PageWrapper';
import { ROUTES } from '@/constants';
import { useGetJoinedCampaigns } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaigns } from '@/hooks/useCampaigns';
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
  const [view, setView] = useState<'grid' | 'table'>('grid');
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
  } = usePagination();

  const isMobile = useIsMobile();
  useReserveLayoutBottomOffset(isMobile);

  const isGridView = view === 'grid';
  const isHostedWithoutActiveAddress =
    tabFilter === TabFilter.HOSTED && !activeAddress;

  const statusFilter = useMemo(() => {
    if (tabFilter === TabFilter.HISTORY) {
      return CampaignStatus.COMPLETED;
    }
    return CampaignStatus.ACTIVE;
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

  const queryParams = filterFalsyQueryParams({
    chain_id: appliedFilters.network,
    status: statusFilter,
    launcher: launcherFilter,
    limit,
    skip,
  }) as CampaignsQueryParams;

  const {
    data,
    isLoading: isCampaignsLoading,
    isFetching: isCampaignsFetching,
  } = useCampaigns(queryParams, {
    enabled:
      tabFilter !== TabFilter.JOINED &&
      historyViewFilter !== HistoryViewFilter.JOINED &&
      !isHostedWithoutActiveAddress,
  });

  const { data: joinedCampaignsData, isLoading: isJoinedCampaignsLoading } =
    useGetJoinedCampaigns(queryParams, {
      enabled:
        tabFilter === TabFilter.JOINED ||
        (tabFilter === TabFilter.HISTORY &&
          historyViewFilter === HistoryViewFilter.JOINED),
    });

  const isLoading = isCampaignsLoading || isJoinedCampaignsLoading;
  const campaignsData = isHostedWithoutActiveAddress
    ? { results: [] }
    : tabFilter === TabFilter.JOINED
      ? joinedCampaignsData
      : data;

  const disableFilters = isLoading || isCampaignsFetching;

  return (
    <PageWrapper>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        mb={{ xs: 4, md: 6 }}
        mx={{ xs: -2, md: 0 }}
        pb={{ xs: 3, md: 0 }}
        px={{ xs: 2, md: 0 }}
        gap={{ xs: 3, md: 4 }}
        borderBottom={{ xs: '1px solid #473c74', md: 'none' }}
      >
        <Stack>
          <Typography
            variant={isMobile ? 'h5' : 'h3'}
            color="white"
            fontWeight={isMobile ? 600 : 800}
            mb={{ xs: 0.5, md: 1.5 }}
            letterSpacing={isMobile ? '0px' : '-1.5px'}
          >
            Campaigns
          </Typography>
          <Typography fontSize={15} fontWeight={400} color="#6b6490">
            Join or host trading campaigns to earn rewards.
          </Typography>
        </Stack>
        <Box display="flex" gap={2}>
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
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        mb={4}
      >
        <Box
          display="flex"
          alignItems="center"
          position="relative"
          minWidth={0}
          gap={1.5}
        >
          <CampaignsTabs
            activeTab={tabFilter}
            setActiveTab={setTabFilter}
            isDisabled={disableFilters}
          />
          <CampaignsFilters
            appliedFilters={appliedFilters}
            handleApplyFilters={setAppliedFilters}
            isDisabled={disableFilters}
          />
        </Box>
        <CampaignsViewToggle
          isGridView={isGridView}
          disableFilters={disableFilters}
          changeView={setView}
        />
      </Box>
      {tabFilter === TabFilter.HISTORY && (
        <HistoryFilters
          selectedFilter={historyViewFilter}
          setSelectedFilter={setHistoryViewFilter}
          isDisabled={disableFilters}
        />
      )}
      <CampaignsFeed
        data={campaignsData?.results ?? []}
        isGridView={isGridView}
        isLoading={isLoading}
        isFetching={isCampaignsFetching}
        tabFilter={tabFilter}
      />
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mx="auto"
        mt={4}
      >
        <Button
          variant="contained"
          color="error"
          sx={{ width: '200px' }}
          fullWidth={isMobile}
          disabled={isCampaignsFetching}
        >
          Load More
        </Button>
      </Box>
      <MobileBottomNav isVisible={isMobile} />
    </PageWrapper>
  );
};

export default Campaigns;
