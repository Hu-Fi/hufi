import { useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsEmptyState from '@/components/CampaignsEmptyState';
import CampaignsFeed from '@/components/CampaignsFeed';
import { useJoinedCampaigns } from '@/hooks/recording-oracle';
import type { CampaignsQueryParams, JoinedCampaign } from '@/types';
import { appendUniqueCampaigns } from '@/utils';

type Props = {
  queryParams: CampaignsQueryParams;
  hasActiveFilters: boolean;
  isGridView: boolean;
  isHistory: boolean;
  setNextPage: () => void;
};

const JoinedCampaigns: FC<Props> = ({
  queryParams,
  hasActiveFilters,
  isGridView,
  isHistory,
  setNextPage,
}) => {
  const [campaigns, setCampaigns] = useState<JoinedCampaign[]>([]);

  const { data, isLoading, isFetching } = useJoinedCampaigns(queryParams);

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

  const showLoadMore = isLoading || isFetching || data?.has_more;

  const showEmptyState = !isLoading && !isFetching && campaigns.length === 0;

  return (
    <>
      {showEmptyState ? (
        <CampaignsEmptyState
          view="joined"
          hasActiveFilters={hasActiveFilters}
          isHistory={isHistory}
        />
      ) : (
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
