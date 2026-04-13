import { useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsFeed from '@/components/CampaignsFeed';
import { useJoinedCampaigns } from '@/hooks/recording-oracle';
import type { CampaignsQueryParams, JoinedCampaign } from '@/types';

type Props = {
  queryParams: CampaignsQueryParams;
  isGridView: boolean;
  setNextPage: () => void;
};

const JoinedCampaigns: FC<Props> = ({
  queryParams,
  isGridView,
  setNextPage,
}) => {
  const [campaigns, setCampaigns] = useState<JoinedCampaign[]>([]);

  const { data, isLoading, isFetching } = useJoinedCampaigns(queryParams);

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
        isJoinedCampaigns
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

export default JoinedCampaigns;
