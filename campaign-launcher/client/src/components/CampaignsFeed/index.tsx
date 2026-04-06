import { type FC } from 'react';

import { Box, Grid } from '@mui/material';

import CampaignCard from '@/components/CampaignCard';
import SkeletonCard from '@/components/CampaignCard/SkeletonView';
import CampaignsTable from '@/components/CampaignsTable';
import {
  DEFAULT_CAMPAIGNS_QUERY_LIMIT,
  DEFAULT_CAMPAIGNS_QUERY_LIMIT_MOBILE,
} from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { type Campaign, CampaignsTabFilter as TabFilter } from '@/types';

type Props = {
  data: Campaign[];
  isGridView: boolean;
  isLoading: boolean;
  isFetching: boolean;
  tabFilter: TabFilter;
};

const CampaignsFeed: FC<Props> = ({
  data,
  isGridView,
  isLoading,
  isFetching,
  tabFilter,
}) => {
  const isMobile = useIsMobile();
  const pageSize = isMobile
    ? DEFAULT_CAMPAIGNS_QUERY_LIMIT_MOBILE
    : DEFAULT_CAMPAIGNS_QUERY_LIMIT;

  return (
    <>
      {isGridView || isMobile ? (
        <Box position="relative">
          {!isLoading && isFetching && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              width="100%"
              height="100%"
              zIndex={1000}
              bgcolor="black"
              sx={{
                opacity: 0.3,
              }}
            />
          )}
          <Grid container spacing={3}>
            {isLoading &&
              Array.from({ length: pageSize }).map((_, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <SkeletonCard />
                </Grid>
              ))}
            {data?.map((campaign) => (
              <Grid key={campaign.address} size={{ xs: 12, sm: 6, md: 4 }}>
                <CampaignCard campaign={campaign} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <CampaignsTable
          data={data}
          isFetching={isLoading || isFetching}
          isJoinedCampaigns={tabFilter === TabFilter.JOINED}
          isMyCampaigns={tabFilter === TabFilter.HOSTED}
        />
      )}
    </>
  );
};

export default CampaignsFeed;
