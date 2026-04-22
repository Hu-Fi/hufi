import { type FC, useCallback, useMemo, useState } from 'react';

import { Button, CircularProgress } from '@mui/material';
import { useMatch, useNavigate } from 'react-router';
import { useConnection } from 'wagmi';

import { ROUTES } from '@/constants';
import { useJoinCampaign } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useAuthedUserData } from '@/providers/AuthedUserData';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { CampaignStatus, ExchangeType, type Campaign } from '@/types';
import * as errorUtils from '@/utils/error';

import JoinCampaignOverlay from './JoinCampaignOverlay';

type Props = {
  campaign: Campaign;
};

const JoinCampaignButton: FC<Props> = ({ campaign }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [startStep, setStartStep] = useState<'connect' | 'auth'>('connect');

  const navigate = useNavigate();
  const { isConnected } = useConnection();
  const { isAuthenticated } = useWeb3Auth();
  const {
    enrolledExchanges,
    isEnrolledExchangesLoading,
    joinedCampaigns,
    isJoinedCampaignsLoading,
  } = useAuthedUserData();
  const { exchangesMap } = useExchangesContext();
  const { mutateAsync: joinCampaign, isPending: isJoining } = useJoinCampaign();
  const { showError } = useNotification();

  const isMobile = useIsMobile();
  const isDetailsPage = !!useMatch(ROUTES.CAMPAIGN_DETAILS);
  const isLoading =
    isEnrolledExchangesLoading || isJoinedCampaignsLoading || isJoining;

  const isAlreadyJoined = useMemo(
    () =>
      !!joinedCampaigns?.results.some(
        (joinedCampaign) => joinedCampaign.address === campaign.address
      ),
    [joinedCampaigns?.results, campaign.address]
  );
  const exchangeInfo = exchangesMap.get(campaign.exchange_name);

  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
  };

  const handleJoinCampaign = useCallback(async () => {
    if (!campaign || !exchangeInfo) return;

    const hasEnrolledApiKey = (enrolledExchanges || []).includes(
      campaign.exchange_name
    );
    if (exchangeInfo.type === ExchangeType.CEX && !hasEnrolledApiKey) {
      navigate(`${ROUTES.MANAGE_API_KEYS}?exchange=${campaign.exchange_name}`);
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
  }, [
    campaign,
    exchangeInfo,
    enrolledExchanges,
    joinCampaign,
    navigate,
    showError,
  ]);

  const handleButtonClick = async () => {
    if (isLoading || !campaign) return;

    if (!isConnected || !isAuthenticated) {
      setIsOverlayOpen(true);
      setStartStep(isConnected ? 'auth' : 'connect');
      return;
    }

    await handleJoinCampaign();
  };

  const getButtonText = () => {
    if (isJoining) {
      return null;
    }

    if (isDetailsPage) {
      return 'Join Campaign';
    }

    return 'Join';
  };

  const isCampaignFinished =
    campaign.end_date < new Date().toISOString() ||
    campaign.status !== CampaignStatus.ACTIVE;

  const isAbleToJoin =
    !!campaign &&
    !isAlreadyJoined &&
    !isCampaignFinished &&
    !!exchangeInfo?.enabled;

  if (!isAbleToJoin) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        size="large"
        color="error"
        fullWidth={isMobile}
        disabled={isLoading}
        sx={{ color: 'white' }}
        onClick={handleButtonClick}
      >
        {isJoining ? (
          <CircularProgress size={24} sx={{ color: 'primary.contrast' }} />
        ) : (
          getButtonText()
        )}
      </Button>
      <JoinCampaignOverlay
        key={startStep}
        open={isOverlayOpen}
        startStep={startStep}
        onClose={handleOverlayClose}
        handleJoinCampaign={handleJoinCampaign}
      />
    </>
  );
};

export default JoinCampaignButton;
