import { type FC } from 'react';

import LaunchCampaignForm from '@/components/LaunchCampaignForm';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';

const LaunchCampaignPage: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Create Campaign" />
      <LaunchCampaignForm />
    </PageWrapper>
  );
};

export default LaunchCampaignPage;
