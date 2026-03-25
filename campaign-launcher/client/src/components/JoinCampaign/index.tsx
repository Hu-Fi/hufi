import { type FC, useMemo, useState } from 'react';

import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router';
import { useConnection } from 'wagmi';

import { ROUTES } from '@/constants';
import {
  useGetEnrolledExchanges,
  useJoinCampaign,
} from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { CampaignStatus, ExchangeType, type Campaign } from '@/types';
import * as errorUtils from '@/utils/error';

import JoinCampaignOverlay from './JoinCampaignOverlay';

type Props = {
  campaign: Campaign;
};

const JoinCampaign: FC<Props> = ({ campaign }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [startStep, setStartStep] = useState<'connect' | 'auth'>('connect');

  const navigate = useNavigate();
  const { isConnected } = useConnection();
  const { isAuthenticated, joinedCampaigns, isJoinedCampaignsLoading } =
    useWeb3Auth();
  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } =
    useGetEnrolledExchanges();
  const { exchangesMap } = useExchangesContext();
  const { mutateAsync: joinCampaign, isPending: isJoining } = useJoinCampaign();
  const { showError } = useNotification();

  const isMobile = useIsMobile();

  const isLoading =
    isEnrolledExchangesLoading || isJoinedCampaignsLoading || isJoining;

  const isAlreadyJoined = useMemo(
    () =>
      !!joinedCampaigns?.results.some(
        (joinedCampaign) =>
          joinedCampaign.address.toLowerCase() ===
          campaign.address.toLowerCase()
      ),
    [joinedCampaigns?.results, campaign.address]
  );
  const exchangeInfo = exchangesMap.get(campaign.exchange_name);

  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
  };

  const handleJoinCampaign = async () => {
    if (!campaign || !exchangeInfo) return;

    const hasEnrolledApiKey = (enrolledExchanges || []).includes(
      campaign.exchange_name
    );
    if (exchangeInfo.type === ExchangeType.CEX && !hasEnrolledApiKey) {
      navigate(ROUTES.MANAGE_API_KEYS);
      return;
    }
    try {
      await joinCampaign({
        chainId: campaign.chain_id,
        address: campaign.address,
      });
    } catch (error) {
      console.error('Failed to join campaign', error);
      showError(
        errorUtils.getMessageFromError(error) ||
          'Failed to join campaign. Please try again.'
      );
    }
  };

  const handleButtonClick = async () => {
    if (isLoading || !campaign) return;

    if (!isConnected || !isAuthenticated) {
      setIsOverlayOpen(true);
      setStartStep(isConnected ? 'auth' : 'connect');
      return;
    }

    await handleJoinCampaign();
  };

  const isCampaignFinished =
    campaign.end_date < new Date().toISOString() ||
    campaign.status !== CampaignStatus.ACTIVE;

  if (
    !campaign ||
    !exchangeInfo?.enabled ||
    isAlreadyJoined ||
    isCampaignFinished
  ) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        size="large"
        color="error"
        fullWidth={isMobile}
        sx={{
          color: 'white',
        }}
        disabled={isLoading}
        onClick={handleButtonClick}
      >
        {isJoining ? (
          <CircularProgress size={24} sx={{ color: 'primary.contrast' }} />
        ) : (
          'Join'
        )}
      </Button>
      <JoinCampaignOverlay
        key={startStep}
        open={isOverlayOpen}
        onClose={handleOverlayClose}
        startStep={startStep}
      />
    </>
  );
};

export default JoinCampaign;
