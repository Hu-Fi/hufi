import { type FC, useState } from 'react';

import { Button, CircularProgress } from '@mui/material';

import AddKeysPromptModal from '@/components/modals/AddKeysPromptModal';
import {
  useGetEnrolledExchanges,
  useJoinCampaign,
} from '@/hooks/recording-oracle';
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

  const isCampaignFinished =
    campaign.status === CampaignStatus.TO_CANCEL ||
    campaign.end_date < new Date().toISOString();

  const isLoading = isEnrolledExchangesLoading || isJoinedLoading || isJoining;
  const isButtonDisabled =
    !isAuthenticated || isLoading || isAlreadyJoined || isCampaignFinished;

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
          ml: { xs: 0, md: 'auto' },
          mt: { xs: 2, md: 0 },
          color: 'primary.contrast',
          minWidth: { xs: '100%', sm: '135px' },
        }}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
      >
        {isJoining && (
          <CircularProgress size={20} sx={{ color: 'primary.contrast' }} />
        )}
        {!isJoining &&
          (isAlreadyJoined ? 'Registered to Campaign' : 'Join Campaign')}
      </Button>
      <AddKeysPromptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default JoinCampaign;
