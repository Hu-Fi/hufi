import { FC } from 'react';

import HowToLaunch from '../../components/HowToLaunch';
import JoinedCampaigns from '../../components/JoinedCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';

const JoinedCampaignsPage: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Campaigns" />
      <JoinedCampaigns showPagination={true} showAllCampaigns={true} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default JoinedCampaignsPage;
