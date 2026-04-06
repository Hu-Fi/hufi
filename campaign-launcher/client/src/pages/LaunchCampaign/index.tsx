import { type FC } from 'react';

import LaunchCampaignForm from '@/components/LaunchCampaignForm';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import PageWrapper from '@/components/PageWrapper';
import { useIsMobile } from '@/hooks/useBreakpoints';

const LaunchCampaignPage: FC = () => {
  const isMobile = useIsMobile();

  useReserveLayoutBottomOffset(isMobile);

  return (
    <PageWrapper>
      <LaunchCampaignForm />
    </PageWrapper>
  );
};

export default LaunchCampaignPage;
