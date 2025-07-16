import { FC } from 'react';

import AllCampaigns from '../../components/AllCampaigns';
import HowToLaunch from '../../components/HowToLaunch';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';

const AllCampaignsPage: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Campaigns" />
      <AllCampaigns showPagination={true} showAllCampaigns={true} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default AllCampaignsPage;
