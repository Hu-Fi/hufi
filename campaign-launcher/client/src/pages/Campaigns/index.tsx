import { useState, type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import CampaignsFeed from '@/components/CampaignsFeed';
import CampaignsFilters, {
  type CampaignsFiltersSelection,
} from '@/components/CampaignsFilters';
import CampaignsTabs from '@/components/CampaignsTabs';
import CampaignsViewToggle from '@/components/CampaignsViewToggle';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import MobileBottomNav from '@/components/MobileBottomNav';
import PageWrapper from '@/components/PageWrapper';
import { useGetJoinedCampaigns } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaigns } from '@/hooks/useCampaigns';
import usePagination from '@/hooks/usePagination';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { config as wagmiConfig } from '@/providers/WagmiProvider';
import {
  type CampaignsQueryParams,
  CampaignStatus,
  CampaignsTabFilter as TabFilter,
} from '@/types';
import { filterFalsyQueryParams } from '@/utils';

const Campaigns: FC = () => {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [tabFilter, setTabFilter] = useState<TabFilter>(TabFilter.ACTIVE);
  const [appliedFilters, setAppliedFilters] =
    useState<CampaignsFiltersSelection>({
      campaignTypes: [],
      exchanges: [],
      network: wagmiConfig.chains[0].id,
    });

  const { activeAddress } = useActiveAccount();
  const {
    params: { limit, skip },
  } = usePagination();
  const isMobile = useIsMobile();
  useReserveLayoutBottomOffset(isMobile);

  const isGridView = view === 'grid';
  const isHostedWithoutActiveAddress =
    tabFilter === TabFilter.HOSTED && !activeAddress;

  const queryParams = filterFalsyQueryParams({
    chain_id: appliedFilters.network,
    status: tabFilter === TabFilter.ACTIVE ? CampaignStatus.ACTIVE : undefined,
    launcher: tabFilter === TabFilter.HOSTED ? activeAddress : undefined,
    limit,
    skip,
  }) as CampaignsQueryParams;

  const {
    data,
    isLoading: isCampaignsLoading,
    isFetching: isCampaignsFetching,
  } = useCampaigns(queryParams, {
    enabled: tabFilter !== TabFilter.JOINED && !isHostedWithoutActiveAddress,
  });

  const { data: joinedCampaignsData, isLoading: isJoinedCampaignsLoading } =
    useGetJoinedCampaigns(queryParams);

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
          <LaunchCampaignButton size="large" />
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
      <CampaignsFeed
        data={campaignsData?.results ?? []}
        isGridView={isGridView}
        isLoading={isLoading}
        isFetching={isCampaignsFetching}
        tabFilter={tabFilter}
      />
      <MobileBottomNav isVisible={isMobile} />
    </PageWrapper>
  );
};

export default Campaigns;
