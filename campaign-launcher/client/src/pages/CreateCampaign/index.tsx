import { type FC } from 'react';

import CreateCampaignForm from '@/components/CreateCampaignForm';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';

const CreateCampaignPage: FC = () => {
  return (
    <PageWrapper>
      <PageTitle title="Create Campaign" />
      <CreateCampaignForm />
    </PageWrapper>
  );
};

export default CreateCampaignPage;
