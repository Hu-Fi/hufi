import { useEffect, useState, type FC } from 'react';

import { Box, Button } from '@mui/material';

import CampaignsFeed from '@/components/CampaignsFeed';
import { useHostedCampaigns } from '@/hooks/useCampaigns';
import type { Campaign, CampaignsQueryParams } from '@/types';

type Props = {
  isGridView: boolean;
  queryParams: CampaignsQueryParams;
  setNextPage: () => void;
};

const HostedCampaigns: FC<Props> = ({
  queryParams,
  isGridView,
  setNextPage,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { data, isLoading, isFetching } = useHostedCampaigns(queryParams);

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
        isHostedCampaigns
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

export default HostedCampaigns;
