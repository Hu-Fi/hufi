import type { FC } from 'react';

import Campaigns from '@/components/Campaigns';
import DashboardStats from '@/components/DashboardStats';
import HowToLaunch from '@/components/HowToLaunch';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';

const Dashboard: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Dashboard" />
      <DashboardStats />
      <Campaigns />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Dashboard;
