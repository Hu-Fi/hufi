import { type FC, useState } from 'react';

import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import { Button, CircularProgress } from '@mui/material';

import AddKeysPromptModal from '@/components/modals/AddKeysPromptModal';
import {
  useGetEnrolledExchanges,
  useJoinCampaign,
} from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { CampaignStatus, type CampaignDetails } from '@/types';

type Props = {
  campaign: CampaignDetails;
  isAlreadyJoined: boolean;
  isJoinedLoading: boolean;
};

const JoinCampaign: FC<Props> = ({
  campaign,
  isAlreadyJoined,
  isJoinedLoading,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useWeb3Auth();
  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } =
    useGetEnrolledExchanges();
  const { mutate: joinCampaign, isPending: isJoining } = useJoinCampaign();

  const isMobile = useIsMobile();

  const isCampaignFinished =
    campaign.status === CampaignStatus.TO_CANCEL ||
    campaign.end_date < new Date().toISOString();

  const isLoading = isEnrolledExchangesLoading || isJoinedLoading || isJoining;
  const isButtonDisabled =
    !isAuthenticated || isLoading || isAlreadyJoined || isCampaignFinished;

  const getButtonText = () => {
    if (isJoining) return null;
    if (isAlreadyJoined) {
      return isMobile ? 'Joined' : 'Registered to Campaign';
    }
    return isMobile ? 'Join' : 'Join Campaign';
  };

  const handleButtonClick = () => {
    if (isButtonDisabled) {
      return;
    }

    if (
      !enrolledExchanges ||
      !enrolledExchanges.includes(campaign.exchange_name)
    ) {
      setModalOpen(true);
      return;
    }

    joinCampaign({ chainId: campaign.chain_id, address: campaign.address });
  };

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
          <CircularProgress size={20} sx={{ color: 'primary.contrast' }} />
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
