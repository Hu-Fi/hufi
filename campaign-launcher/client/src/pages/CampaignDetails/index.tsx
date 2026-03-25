import { type FC, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router';

import CampaignInfo from '@/components/CampaignInfo';
import CampaignStats from '@/components/CampaignStats';
import PageWrapper from '@/components/PageWrapper';
import { useCampaignDetails } from '@/hooks/useCampaigns';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { type EvmAddress } from '@/types';
import { isCampaignDetails } from '@/utils';

const CampaignDetails: FC = () => {
  const { address } = useParams() as { address: EvmAddress };
  const [searchParams] = useSearchParams();
  const { data: campaign, isFetching: isCampaignLoading } =
    useCampaignDetails(address);
  const { joinedCampaigns } = useWeb3Auth();

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

  const isJoined = useMemo(() => {
    return !!joinedCampaigns?.results.some(
      (joinedCampaign) =>
        joinedCampaign.address.toLowerCase() === campaign?.address.toLowerCase()
    );
  }, [joinedCampaigns?.results, campaign?.address]);

  const campaignData = campaign || parsedData;

  return (
    <PageWrapper>
      <CampaignInfo
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
      />
      <CampaignStats
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
        isJoined={isJoined}
      />
    </PageWrapper>
  );
};

export default CampaignDetails;
