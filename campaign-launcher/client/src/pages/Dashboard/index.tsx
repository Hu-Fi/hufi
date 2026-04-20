import { useState, type FC } from 'react';

import { Box, Button, Grid, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router';

import AboutHuFi from '@/components/AboutHuFi';
import CampaignsFeed from '@/components/CampaignsFeed';
import CampaignsViewToggle from '@/components/CampaignsViewToggle';
import DashboardWidgets from '@/components/DashboardWidgets';
import FAQ from '@/components/FAQ';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import MobileBottomNav from '@/components/MobileBottomNav';
import PageWrapper from '@/components/PageWrapper';
import { PERSISTED_CAMPAIGNS_VIEW_KEY, ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaigns } from '@/hooks/useCampaigns';
import usePagination from '@/hooks/usePagination';
import { ChevronIcon } from '@/icons';
import { useAuthedUserData } from '@/providers/AuthedUserData';
import { useNetwork } from '@/providers/NetworkProvider';
import { type CampaignsQueryParams, CampaignStatus } from '@/types';
import { filterFalsyQueryParams } from '@/utils';

const LinkToCampaigns = () => (
  <Link
    component={RouterLink}
    to={ROUTES.CAMPAIGNS}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: { xs: 'space-between', sm: 'flex-start' },
      width: { xs: '100%', sm: 'auto' },
      color: 'white',
      fontSize: { xs: 20, sm: 24 },
      fontWeight: { xs: 500, sm: 800 },
      letterSpacing: { xs: '0px', sm: '-0.5px' },
      gap: 1,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    }}
  >
    Campaigns
    <ChevronIcon sx={{ transform: 'rotate(-90deg)', color: 'white' }} />
  </Link>
);

const Dashboard: FC = () => {
  const [view, setView] = useState<'grid' | 'table'>(() => {
    const persistedView = localStorage.getItem(PERSISTED_CAMPAIGNS_VIEW_KEY);
    return persistedView === 'table' ? 'table' : 'grid';
  });

  const { isJoinedCampaignsLoading } = useAuthedUserData();
  const { appChainId } = useNetwork();
  const isMobile = useIsMobile();
  useReserveLayoutBottomOffset(isMobile);
  const {
    params: { limit, skip },
  } = usePagination();

  const isGridView = view === 'grid';

  const queryParams = filterFalsyQueryParams({
    chain_id: appChainId,
    status: [CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL],
    limit,
    skip,
  }) as CampaignsQueryParams;

  const {
    data,
    isLoading: isCampaignsLoading,
    isFetching: isCampaignsFetching,
  } = useCampaigns(queryParams);

  const isLoading = isCampaignsLoading || isJoinedCampaignsLoading;

  const handleChangeView = (nextView: 'grid' | 'table') => {
    setView(nextView);
    localStorage.setItem(PERSISTED_CAMPAIGNS_VIEW_KEY, nextView);
  };

  return (
    <PageWrapper>
      <DashboardWidgets />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={{ xs: 2, md: 3 }}
      >
        <LinkToCampaigns />
        {!isMobile && (
          <CampaignsViewToggle
            isGridView={isGridView}
            disableFilters={false}
            onViewChange={handleChangeView}
          />
        )}
      </Box>
      <CampaignsFeed
        data={data?.results ?? []}
        isGridView={isGridView}
        isLoading={isLoading}
        isFetching={isCampaignsFetching}
      />
      {isMobile && (
        <Button
          component={RouterLink}
          to={ROUTES.CAMPAIGNS}
          variant="outlined"
          size="large"
          fullWidth
          sx={{ mt: 2, color: 'white', borderColor: 'error.main' }}
        >
          View All
        </Button>
      )}
      <Grid
        container
        component="section"
        spacing={{ xs: 4, md: 3 }}
        mt={{ xs: 4, md: 8 }}
        minHeight={{ xs: 'auto', md: '400px' }}
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <FAQ />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <AboutHuFi />
        </Grid>
      </Grid>
      <MobileBottomNav isVisible={isMobile} />
    </PageWrapper>
  );
};

export default Dashboard;
