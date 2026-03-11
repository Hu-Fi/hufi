import { type FC, useMemo } from 'react';

import { Skeleton } from '@mui/material';
import { useParams, useSearchParams } from 'react-router';

import CampaignInfo from '@/components/CampaignInfo';
import CampaignStats from '@/components/CampaignStats';
import JoinCampaign from '@/components/JoinCampaign';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';
import { useCheckCampaignJoinStatus } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignDetails } from '@/hooks/useCampaigns';
import { CampaignJoinStatus, type EvmAddress } from '@/types';
import { isCampaignDetails } from '@/utils';

const CampaignDetails: FC = () => {
  const { address } = useParams() as { address: EvmAddress };
  const [searchParams] = useSearchParams();
  const { data: campaign, isFetching: isCampaignLoading } =
    useCampaignDetails(address);
  const { data: joinStatusInfo, isLoading: isJoinStatusLoading } =
    useCheckCampaignJoinStatus(address);

  const isMobile = useIsMobile();

  const parsedData = useMemo(() => {
    const encodedData = searchParams.get('data');
    if (!encodedData) return undefined;

    try {
      const decodedData = atob(encodedData);
      const parsed = JSON.parse(decodedData);

      if (!isCampaignDetails(parsed)) {
        console.error('Invalid campaign data structure', parsed);
        return undefined;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse encoded campaign data', error);
      return undefined;
    }
  }, [searchParams]);

  const campaignData = campaign || parsedData;

  return (
    <PageWrapper>
      <PageTitle title="Campaign Data">
        {!isMobile && campaignData && (
          <JoinCampaign
            campaign={campaignData}
            joinStatus={joinStatusInfo?.status}
            joinedAt={joinStatusInfo?.joined_at}
            isJoinStatusLoading={isJoinStatusLoading}
          />
        )}
      </PageTitle>
      {isCampaignLoading && !isMobile && (
        <Skeleton variant="rectangular" width="100%" height={40} />
      )}
      <CampaignInfo
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
        joinStatus={joinStatusInfo?.status}
        joinedAt={joinStatusInfo?.joined_at}
        isJoinStatusLoading={isJoinStatusLoading}
      />
      <CampaignStats
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
        isJoined={
          joinStatusInfo?.status === CampaignJoinStatus.USER_ALREADY_JOINED
        }
      />
    </PageWrapper>
  );
};

export default CampaignDetails;
