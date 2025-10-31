import { type FC, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';

import CampaignInfo from '@/components/CampaignInfo';
import CampaignStats from '@/components/CampaignStats';
import HowToLaunch from '@/components/HowToLaunch';
import JoinCampaign from '@/components/JoinCampaign';
import JoinedCampaigns from '@/components/JoinedCampaigns';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';
import { useCheckIsJoinedCampaign } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignDetails } from '@/hooks/useCampaigns';
import type { EvmAddress } from '@/types';
import { isCampaignDetails } from '@/utils';

const Campaign: FC = () => {
  const { address } = useParams() as { address: EvmAddress };
  const [searchParams] = useSearchParams();
  const { data: campaign, isLoading: isCampaignLoading } =
    useCampaignDetails(address);
  const { data: isAlreadyJoined, isLoading: isJoinedLoading } =
    useCheckIsJoinedCampaign(address);

  const isMobile = useIsMobile();

  const parsedData = useMemo(() => {
    const encodedData = searchParams.get('data');
    if (!encodedData) return undefined;

    try {
      const decodedData = atob(encodedData);
      const parsed = JSON.parse(decodedData);

      if (!isCampaignDetails(parsed)) {
        console.error('Invalid campaign data structure', parsed);
        return undefined;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse encoded campaign data', error);
      return undefined;
    }
  }, [searchParams]);

  const campaignData = campaign || parsedData;
  const showCampaignBlocks = !isCampaignLoading && !!campaignData;

  return (
    <PageWrapper>
      <PageTitle title="Campaign Data" />
      {isCampaignLoading && (
        <CircularProgress
          sx={{ width: '40px', height: '40px', margin: '0 auto' }}
        />
      )}
      {showCampaignBlocks && (
        <Box display="flex" flexWrap="wrap" gap={2}>
          <CampaignInfo campaign={campaignData} />
          <JoinCampaign
            campaign={campaignData}
            isJoined={!!isAlreadyJoined}
            isJoinedLoading={isJoinedLoading}
          />
          {!isMobile && (
            <JoinCampaign
              campaign={campaignData}
              isAlreadyJoined={!!isAlreadyJoined}
              isJoinedLoading={isJoinedLoading}
            />
          )}
        </Box>
      )}
      {showCampaignBlocks && (
        <CampaignStats campaign={campaignData} isJoined={!!isAlreadyJoined} />
      )}
      <Typography variant="h6">Joined Campaigns</Typography>
      <JoinedCampaigns
        showOnlyActiveCampaigns={false}
        showPagination={false}
        showViewAll={true}
      />
      <HowToLaunch />
    </PageWrapper>
  );
};

export default Campaign;
