import { FC } from 'react';

import HowToLaunch from '../../components/HowToLaunch';
import MyCampaigns from '../../components/MyCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';

const MyCampaignsPage: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Campaigns" />
      <MyCampaigns showPagination={true} showAllCampaigns={true} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default MyCampaignsPage;
