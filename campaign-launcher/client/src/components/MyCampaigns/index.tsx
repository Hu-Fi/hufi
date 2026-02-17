import type { FC } from 'react';

import { CircularProgress } from '@mui/material';

import CampaignsTable from '@/components/CampaignsTable';
import CampaignsTablePagination from '@/components/CampaignsTablePagination';
import { useMyCampaigns } from '@/hooks/useCampaigns';
import useIsDevFirstRender from '@/hooks/useIsDevFirstRender';
import usePagination from '@/hooks/usePagination';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { CampaignStatus, type CampaignsQueryParams } from '@/types';
import { filterFalsyQueryParams } from '@/utils';

type Props = {
  showOnlyActiveCampaigns: boolean;
};

const MyCampaigns: FC<Props> = ({ showOnlyActiveCampaigns }) => {
  const { activeAddress } = useActiveAccount();
  const { appChainId } = useNetwork();
  const isDevFirstRender = useIsDevFirstRender();
  const { params, pagination, setPageSize, setNextPage, setPrevPage } =
    usePagination();
  const { limit, skip } = params;
  const { page, pageSize } = pagination;

  const queryParams = filterFalsyQueryParams({
    chain_id: appChainId,
    launcher: activeAddress,
    status: showOnlyActiveCampaigns ? CampaignStatus.ACTIVE : undefined,
    limit,
    skip,
  }) as CampaignsQueryParams;

  const { data, isLoading, isFetching } = useMyCampaigns(
    queryParams,
    isDevFirstRender
  );

  return (
    <>
      {isLoading && (
        <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />
      )}
      {!isLoading && (
        <>
          <CampaignsTable
            data={data?.results || []}
            isFetching={isFetching}
            isMyCampaigns={true}
          />
          <CampaignsTablePagination
            page={page}
            resultsLength={data?.results?.length || 0}
            hasMore={data?.has_more}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setNextPage={setNextPage}
            setPrevPage={setPrevPage}
          />
        </>
      )}
    </>
  );
};

export default MyCampaigns;
