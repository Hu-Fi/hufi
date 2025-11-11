import { type FC, useState } from 'react';

import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import { Button, CircularProgress } from '@mui/material';

import AddKeysPromptModal from '@/components/modals/AddKeysPromptModal';
import {
  useGetEnrolledExchanges,
  useJoinCampaign,
} from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import {
  CampaignJoinStatus,
  CampaignStatus,
  type CampaignDetails,
} from '@/types';
import { HttpError } from '@/utils/HttpClient';

type Props = {
  campaign: CampaignDetails;
  joinStatus?: CampaignJoinStatus;
  isJoinStatusLoading: boolean;
};

const JoinCampaign: FC<Props> = ({
  campaign,
  joinStatus,
  isJoinStatusLoading,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { isAuthenticated } = useWeb3Auth();
  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } =
    useGetEnrolledExchanges();
  const { mutateAsync: joinCampaign, isPending: isJoining } = useJoinCampaign();
  const { showError } = useNotification();

  const isMobile = useIsMobile();

  const isCampaignFinished =
    campaign.status === CampaignStatus.TO_CANCEL ||
    campaign.end_date < new Date().toISOString();

  const isLoading =
    isEnrolledExchangesLoading || isJoinStatusLoading || isJoining;

  const isAlreadyJoined = joinStatus === CampaignJoinStatus.USER_ALREADY_JOINED;
  const isJoinLimited = joinStatus === CampaignJoinStatus.JOIN_IS_LIMITED;

  const isButtonDisabled =
    !isAuthenticated ||
    isLoading ||
    !joinStatus ||
    isAlreadyJoined ||
    isJoinLimited ||
    isCampaignFinished;

  const getButtonText = () => {
    if (isJoining) return null;

    if (isAlreadyJoined) {
      return isMobile ? 'Joined' : 'Registered to Campaign';
    }

    if (isJoinLimited) {
      return isMobile ? 'Join' : 'Registration Closed';
    }

    return isMobile ? 'Join' : 'Join Campaign';
  };

  const handleButtonClick = async () => {
    if (isButtonDisabled || !campaign) {
      return;
    }

    if (
      !enrolledExchanges ||
      !enrolledExchanges.includes(campaign.exchange_name)
    ) {
      setModalOpen(true);
      return;
    }

    try {
      await joinCampaign({
        chainId: campaign.chain_id,
        address: campaign.address,
      });
    } catch (error) {
      console.error('Failed to join campaign', error);

      let userFacingError = 'Failed to join campaign. Please try again.';
      if (error instanceof HttpError && error.responseMessage) {
        userFacingError = error.responseMessage;
      }
      showError(userFacingError);
    }
  };

  if (!campaign || isCampaignFinished) {
    return null;
  }

  if (!isAuthenticated && !isMobile) {
    return (
      <Button variant="contained" size="large" disabled sx={{ ml: 'auto' }}>
        Sign in to Join Campaign
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        size="medium"
        sx={{
          ml: 'auto',
          color: 'primary.contrast',
          minWidth: isMobile ? '105px' : '135px',
        }}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
        endIcon={isMobile && isAlreadyJoined && <CheckIcon />}
      >
        {isJoining && (
          <CircularProgress size={24} sx={{ color: 'primary.contrast' }} />
        )}
        {getButtonText()}
      </Button>
      <AddKeysPromptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default JoinCampaign;
