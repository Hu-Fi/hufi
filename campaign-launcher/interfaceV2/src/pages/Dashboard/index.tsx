import { FC } from 'react';

import { useAccount } from 'wagmi';

import AllCampaigns from '../../components/AllCampaigns';
import DashboardStats from '../../components/DashboardStats';
import HowToLaunch from '../../components/HowToLaunch';
import JoinedCampaigns from '../../components/JoinedCampaigns';
import MyCampaigns from '../../components/MyCampaigns';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';


const Dashboard: FC = () => {
  const { isConnected } = useAccount();

  return (
    <PageWrapper>
      <PageTitle title="Dashboard" />
      <DashboardStats />
      {isConnected && <MyCampaigns showAllCampaigns={false} />}
      {isConnected && <JoinedCampaigns showAllCampaigns={false} />}
      <AllCampaigns showAllCampaigns={false} showPagination={true} />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Dashboard;
