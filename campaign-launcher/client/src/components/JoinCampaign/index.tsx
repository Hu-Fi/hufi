import { type FC, useState } from 'react';

import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/LockOutlined';
import { Box, Button, CircularProgress } from '@mui/material';

import CustomTooltip from '@/components/CustomTooltip';
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
import * as errorUtils from '@/utils/error';

type Props = {
  campaign: CampaignDetails;
  joinStatus?: CampaignJoinStatus;
  joinedAt?: string;
  isJoinStatusLoading: boolean;
};

const JoinCampaign: FC<Props> = ({
  campaign,
  joinStatus,
  joinedAt,
  isJoinStatusLoading,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { isAuthenticated } = useWeb3Auth();
  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } =
    useGetEnrolledExchanges();
  const { mutateAsync: joinCampaign, isPending: isJoining } = useJoinCampaign();
  const { showError } = useNotification();

  const isMobile = useIsMobile();

  const isLoading =
    isEnrolledExchangesLoading || isJoinStatusLoading || isJoining;

  const isAlreadyJoined = joinStatus === CampaignJoinStatus.USER_ALREADY_JOINED;
  const isJoinClosed = joinStatus === CampaignJoinStatus.JOIN_IS_CLOSED;

  const isButtonDisabled =
    !isAuthenticated ||
    isLoading ||
    !joinStatus ||
    isAlreadyJoined ||
    isJoinClosed;

  const getButtonText = () => {
    if (isJoining) return null;

    if (isAlreadyJoined) {
      return isMobile ? 'Joined' : 'Registered to Campaign';
    }

    if (isJoinClosed) {
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
      showError(
        errorUtils.getMessageFromError(error) ||
          'Failed to join campaign. Please try again.'
      );
    }
  };

  const isCampaignFinished =
    campaign.end_date < new Date().toISOString() ||
    campaign.status !== CampaignStatus.ACTIVE;
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

  if (isAlreadyJoined && joinedAt) {
    return (
      <CustomTooltip
        title={`Joined at 
          ${new Date(joinedAt).toLocaleTimeString()} 
          ${new Date(joinedAt).toLocaleDateString()}
        `}
        arrow
        placement="top"
        sx={{ ml: 'auto' }}
      >
        <Box component="span" sx={{ cursor: 'pointer' }}>
          <Button
            variant="contained"
            size="medium"
            disabled
            sx={{
              color: 'primary.contrast',
              minWidth: isMobile ? '105px' : '135px',
              cursor: 'pointer',
            }}
            endIcon={isMobile && <CheckIcon />}
          >
            {isMobile ? 'Joined' : 'Registered to Campaign'}
          </Button>
        </Box>
      </CustomTooltip>
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
        endIcon={
          isMobile &&
          ((isAlreadyJoined && <CheckIcon />) || (isJoinClosed && <LockIcon />))
        }
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
