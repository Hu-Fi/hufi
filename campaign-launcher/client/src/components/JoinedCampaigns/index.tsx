import type { FC } from 'react';

import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import CampaignsTable from '@/components/CampaignsTable';
import CampaignsTablePagination from '@/components/CampaignsTablePagination';
import { useGetJoinedCampaigns } from '@/hooks/recording-oracle';
import useIsDevFirstRender from '@/hooks/useIsDevFirstRender';
import usePagination from '@/hooks/usePagination';
import { CampaignStatus } from '@/types';
import { filterFalsyQueryParams } from '@/utils';

type Props = {
  showOnlyActiveCampaigns: boolean;
  showViewAll?: boolean;
  showPagination?: boolean;
};

const JoinedCampaigns: FC<Props> = ({
  showOnlyActiveCampaigns,
  showPagination = true,
  showViewAll = false,
}) => {
  const navigate = useNavigate();
  const isDevFirstRender = useIsDevFirstRender();
  const { params, pagination, setPageSize, setNextPage, setPrevPage } =
    usePagination();
  const { limit, skip } = params;
  const { page, pageSize } = pagination;

  const queryParams = filterFalsyQueryParams({
    status: showOnlyActiveCampaigns ? CampaignStatus.ACTIVE : undefined,
    limit,
    skip,
  });

  const { data, isLoading, isFetching } = useGetJoinedCampaigns(
    queryParams,
    isDevFirstRender
  );

  const onViewAllClick = () => {
    navigate('/?view=joined');
  };

  return (
    <>
      {isLoading && (
        <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />
      )}
      {!isLoading && (
        <>
          <CampaignsTable
            data={data?.results || []}
            isJoinedCampaigns={true}
            isFetching={isFetching}
          />
          {showPagination && (
            <CampaignsTablePagination
              page={page}
              resultsLength={data?.results?.length || 0}
              hasMore={data?.has_more}
              pageSize={pageSize}
              setPageSize={setPageSize}
              setNextPage={setNextPage}
              setPrevPage={setPrevPage}
            />
          )}
          {showViewAll && data?.has_more && (
            <Button
              variant="contained"
              sx={{ width: { xs: '100%', sm: 'fit-content' } }}
              onClick={onViewAllClick}
            >
              View All
            </Button>
          )}
        </>
      )}
    </>
  );
};

export default JoinedCampaigns;
