import { FC } from 'react';

import { useParams } from 'react-router-dom';

import CampaignInfo from '../../components/CampaignInfo';
import CampaignStats from '../../components/CampaignStats';
import HowToLaunch from '../../components/HowToLaunch';
import JoinedCampaigns from '../../components/JoinedCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';
import { useCampaign } from '../../hooks/useCampaigns';

const Campaign: FC = () => {
  const { chainId, address } = useParams() as {
    chainId: string;
    address: string;
  };

// localhost:3001/campaign-detail/0x000000?details=atob(Json.stringify())


  const { data: campaign, isPending: isCampaignLoading } = useCampaign(
    +chainId,
    address
  );

  return (
    <PageWrapper>
      <PageTitle title="Campaign Data">
        <CampaignInfo
          campaign={campaign}
          isCampaignLoading={isCampaignLoading}
        />
      </PageTitle>
      <CampaignStats campaign={campaign} />
      <JoinedCampaigns showPagination={false} showAllCampaigns={false} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Campaign;
