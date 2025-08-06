import { FC, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import CampaignInfo from '../../components/CampaignInfo';
import CampaignStats from '../../components/CampaignStats';
import HowToLaunch from '../../components/HowToLaunch';
import JoinedCampaigns from '../../components/JoinedCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';
import { useCampaignDetails } from '../../hooks/useCampaigns';
import { isCampaignDetails } from '../../utils';

const Campaign: FC = () => {
  const { address } = useParams() as { address: string };
  const [searchParams] = useSearchParams();
  const { data: campaign, isPending: isCampaignLoading } = useCampaignDetails(address);

  const parsedData = useMemo(() => {
    const encodedData = searchParams.get('data');
    if (!encodedData) return undefined;
    
    try {
      const decodedData = atob(encodedData);
      const parsed = JSON.parse(decodedData);
      
      if (!isCampaignDetails(parsed)) {
        console.error('Invalid campaign data structure:', parsed);
        return undefined;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse form data:', error);
      return undefined;
    }
  }, [searchParams]);

  return (
    <PageWrapper>
      <PageTitle title="Campaign Data">
        <CampaignInfo
          campaign={campaign || parsedData}
          isCampaignLoading={isCampaignLoading}
        />
      </PageTitle>
      <CampaignStats campaign={campaign || parsedData} />
      <JoinedCampaigns showPagination={false} showAllCampaigns={false} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Campaign;
