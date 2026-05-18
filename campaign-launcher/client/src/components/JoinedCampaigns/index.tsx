import { useCallback, useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsEmptyState from '@/components/CampaignsEmptyState';
import CampaignsErrorState from '@/components/CampaignsErrorState';
import CampaignsFeed from '@/components/CampaignsFeed';
import { useJoinedCampaigns } from '@/hooks/recording-oracle';
import type { CampaignsQueryParams, JoinedCampaign } from '@/types';
import { appendUniqueCampaigns } from '@/utils';

type Props = {
  queryParams: CampaignsQueryParams;
  hasActiveFilters: boolean;
  isGridView: boolean;
  setNextPage: () => void;
};

const JoinedCampaigns: FC<Props> = ({
  queryParams,
  hasActiveFilters,
  isGridView,
  setNextPage,
}) => {
  const [campaigns, setCampaigns] = useState<JoinedCampaign[]>([]);

  const { data, isLoading, isFetching, isError, refetch } =
    useJoinedCampaigns(queryParams);

  const currentSkip = queryParams.skip ?? 0;

  useEffect(() => {
    if (!data) {
      setCampaigns([]);
      return;
    }

    setCampaigns((prev) => {
      if (currentSkip === 0) return data.results;
      if (isFetching) return prev;
      return appendUniqueCampaigns(prev, data.results);
    });
  }, [data, currentSkip, isFetching]);

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  const showLoadMore = isLoading || isFetching || data?.has_more;

  const showEmptyState =
    !isLoading && !isFetching && !isError && campaigns.length === 0;

  return (
    <>
      {isError && <CampaignsErrorState onRefetch={handleRefetch} />}
      {showEmptyState && (
        <CampaignsEmptyState
          view="joined"
          hasActiveFilters={hasActiveFilters}
        />
      )}
      {!isError && !showEmptyState && (
        <CampaignsFeed
          data={campaigns}
          isGridView={isGridView}
          isLoading={isLoading}
          isFetching={isFetching}
          isJoinedCampaigns
        />
      )}
      {showLoadMore && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mx: { xs: 0, md: 'auto' },
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            color="error"
            disabled={isFetching || isLoading}
            sx={{ width: { xs: '100%', md: '200px' } }}
            onClick={setNextPage}
          >
            Load More
          </Button>
        </Box>
      )}
    </>
  );
};

export default JoinedCampaigns;
