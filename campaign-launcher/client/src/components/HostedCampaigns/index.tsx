import { useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsEmptyState from '@/components/CampaignsEmptyState';
import CampaignsFeed from '@/components/CampaignsFeed';
import { useHostedCampaigns } from '@/hooks/useCampaigns';
import type { Campaign, CampaignsQueryParams } from '@/types';
import { appendUniqueCampaigns } from '@/utils';

type Props = {
  queryParams: CampaignsQueryParams;
  hasActiveFilters: boolean;
  isGridView: boolean;
  isHistory: boolean;
  setNextPage: () => void;
};

const HostedCampaigns: FC<Props> = ({
  queryParams,
  hasActiveFilters,
  isGridView,
  isHistory,
  setNextPage,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { data, isLoading, isFetching } = useHostedCampaigns(queryParams);

  const currentSkip = queryParams.skip ?? 0;

  useEffect(() => {
    if (!data) return;

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
          view="hosted"
          hasActiveFilters={hasActiveFilters}
          isHistory={isHistory}
        />
      ) : (
        <CampaignsFeed
          data={campaigns}
          isGridView={isGridView}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      )}
      {showLoadMore && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          mx={{ xs: 0, md: 'auto' }}
          mt={4}
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

export default HostedCampaigns;
