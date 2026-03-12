import { type FC } from 'react';

import LaunchCampaignForm from '@/components/LaunchCampaignForm';
import PageWrapper from '@/components/PageWrapper';

const LaunchCampaignPage: FC = () => {
  return (
    <PageWrapper>
      <LaunchCampaignForm />
    </PageWrapper>
  );
};

export default LaunchCampaignPage;
