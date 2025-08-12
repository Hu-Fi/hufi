import { FC } from 'react';

import { CircularProgress } from '@mui/material';
import { useChainId } from 'wagmi';

import { useCampaigns } from '../../hooks/useCampaigns';
import usePagination from '../../hooks/usePagination';
import { CampaignStatus } from '../../types';
import CampaignsTable from '../CampaignsTable';
import CampaignsTablePagination from '../CampaignsTablePagination';

type Props = {
  showOnlyActiveCampaigns: boolean;
};

const AllCampaigns: FC<Props> = ({ showOnlyActiveCampaigns }) => {
  const chainId = useChainId();
  const { params, pagination, setPageSize, setNextPage, setPrevPage } = usePagination();
  const { limit, skip } = params;
  const { page, pageSize } = pagination;

  const { data, isLoading } = useCampaigns(
    {
      chain_id: chainId,
      status: showOnlyActiveCampaigns ? CampaignStatus.ACTIVE : undefined,
      limit,
      skip,
    }
  );

  return (
    <>
      {isLoading && <CircularProgress sx={{ width: '40px', height: '40px', mx: 'auto' }} />}
      {!isLoading && (
        <>
          <CampaignsTable data={data?.results || []} />
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
      ) }
    </>
  );
};

export default AllCampaigns;
