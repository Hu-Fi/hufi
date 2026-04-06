import { useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsFeed from '@/components/CampaignsFeed';
import { useCampaigns } from '@/hooks/useCampaigns';
import {
  type Campaign,
  type CampaignsQueryParams,
  CampaignsTabFilter as TabFilter,
} from '@/types';

type Props = {
  isGridView: boolean;
  queryParams: CampaignsQueryParams;
  setNextPage: () => void;
};

const AllCampaigns: FC<Props> = ({ isGridView, queryParams, setNextPage }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const { data, isLoading, isFetching } = useCampaigns(queryParams);

  const currentSkip = queryParams.skip ?? 0;

  useEffect(() => {
    if (!data || isFetching) return;

    setCampaigns((prev) => {
      if (currentSkip === 0) return data.results;
      return [...prev, ...data.results];
    });
  }, [data, currentSkip, isFetching]);

  const showLoadMore = isLoading || isFetching || data?.has_more;

  return (
    <>
      <CampaignsFeed
        data={campaigns}
        isGridView={isGridView}
        isLoading={isLoading}
        isFetching={isFetching}
        tabFilter={TabFilter.ACTIVE}
      />
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

export default AllCampaigns;
