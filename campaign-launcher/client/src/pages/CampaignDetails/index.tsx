import { type FC, type PropsWithChildren, useMemo } from 'react';

import { Box } from '@mui/material';
import { useParams, useSearchParams } from 'react-router';

import CampaignInfo from '@/components/CampaignInfo';
import CampaignStats from '@/components/CampaignStats';
import CancelCampaignButton from '@/components/CancelCampaignButton';
import CycleInfoSection from '@/components/CycleInfoSection';
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import Leaderboard from '@/components/Leaderboard';
import PageWrapper from '@/components/PageWrapper';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';
import {
  useCheckCampaignJoinStatus,
  useGetLeaderboard,
} from '@/hooks/recording-oracle/campaign';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignDetails } from '@/hooks/useCampaigns';
import { useAuthedUserData } from '@/providers/AuthedUserData';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useSignerContext } from '@/providers/SignerProvider';
import {
  CampaignStatus,
  CampaignType,
  type Campaign,
  type EvmAddress,
} from '@/types';
import { isCampaignDetails } from '@/utils';

const BottomButtonWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height={MOBILE_BOTTOM_NAV_HEIGHT}
      bgcolor="background.default"
      borderTop="2px solid #251d47"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      py={2}
      px={3}
      zIndex={(theme) => theme.zIndex.appBar}
    >
      {children}
    </Box>
  );
};

const CampaignDetails: FC = () => {
  const { address } = useParams() as { address: EvmAddress };
  const [searchParams] = useSearchParams();

  const { signer } = useSignerContext();
  const { joinedCampaigns } = useAuthedUserData();
  const { exchangesMap } = useExchangesContext();
  const isMobile = useIsMobile();

  const { data: campaign, isFetching: isCampaignLoading } =
    useCampaignDetails(address);

  const { data: leaderboard } = useGetLeaderboard({
    address: campaign?.address || '',
    enabled: campaign?.status === CampaignStatus.ACTIVE,
  });

  const { data: joinStatusInfo, isLoading: isJoinStatusLoading } =
    useCheckCampaignJoinStatus(address);

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

  const isJoined = useMemo(() => {
    return !!joinedCampaigns?.results.some(
      (joinedCampaign) =>
        joinedCampaign.address.toLowerCase() === address.toLowerCase()
    );
  }, [joinedCampaigns?.results, address]);

  const exchangeInfo = exchangesMap.get(campaign?.exchange_name || '');

  const campaignData = campaign || parsedData;

  const isOngoingCampaign =
    !!campaignData &&
    campaignData.status === CampaignStatus.ACTIVE &&
    campaignData.start_date < new Date().toISOString() &&
    campaignData.end_date > new Date().toISOString();

  const showJoinCampaignButton =
    isMobile && !isJoined && isOngoingCampaign && !!exchangeInfo?.enabled;

  useReserveLayoutBottomOffset(showJoinCampaignButton);

  const showLeaderboard =
    isOngoingCampaign &&
    campaignData.type !== CampaignType.THRESHOLD &&
    leaderboard &&
    leaderboard.data.length > 0;

  const showCancelCampaignButton =
    !!campaign &&
    campaign.status === CampaignStatus.ACTIVE &&
    campaign.launcher.toLowerCase() === signer?.address?.toLowerCase();

  return (
    <PageWrapper>
      <CampaignInfo
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
        isJoined={isJoined}
        joinedAt={joinStatusInfo?.joined_at}
        isJoinStatusLoading={isJoinStatusLoading}
      />
      <CampaignStats
        campaign={campaignData}
        isCampaignLoading={isCampaignLoading}
        isJoined={isJoined}
        leaderboard={leaderboard}
      />
      {isOngoingCampaign && (
        <CycleInfoSection
          campaign={campaignData}
          totalGenerated={leaderboard?.total || 0}
        />
      )}
      {showLeaderboard && (
        <Leaderboard campaign={campaignData} leaderboard={leaderboard} />
      )}
      {showCancelCampaignButton && (
        <CancelCampaignButton campaign={campaignData as Campaign} />
      )}
      {showJoinCampaignButton && (
        <BottomButtonWrapper>
          <JoinCampaignButton campaign={campaignData as Campaign} />
        </BottomButtonWrapper>
      )}
    </PageWrapper>
  );
};

export default CampaignDetails;
