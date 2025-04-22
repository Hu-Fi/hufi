import { FC } from 'react';

import AllCampaigns from '../../components/AllCampaigns';
import DashboardStats from '../../components/DashboardStats';
import HowToLaunch from '../../components/HowToLaunch';
import JoinedCampaigns from '../../components/JoinedCampaigns';
import MyCampaigns from '../../components/MyCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';

const Dashboard: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Dashboard" />
      <DashboardStats />
      <MyCampaigns showAllCampaigns={false} />
      <JoinedCampaigns showAllCampaigns={false} />
      <AllCampaigns showAllCampaigns={false} showPagination={true} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Dashboard;
