import { FC } from 'react';

import { CircularProgress } from '@mui/material';
import { useChainId } from 'wagmi';

import { useMyCampaigns } from '../../hooks/useCampaigns';
import usePagination from '../../hooks/usePagination';
import { useActiveAccount } from '../../providers/ActiveAccountProvider';
import { CampaignStatus } from '../../types';
import CampaignsTable from '../CampaignsTable';
import CampaignsTablePagination from '../CampaignsTablePagination';

type Props = {
  showOnlyActiveCampaigns: boolean;
};

const MyCampaigns: FC<Props> = ({ showOnlyActiveCampaigns }) => {
  const { activeAddress } = useActiveAccount();
  const chain_id = useChainId();
  const { params, pagination, setPageSize, setNextPage, setPrevPage } = usePagination();
  const { limit, skip } = params;
  const { page, pageSize } = pagination;

  const { data, isLoading } = useMyCampaigns(
    {
      chain_id,
      launcher: activeAddress,
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
          <CampaignsTable
            data={data?.results || []}
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
