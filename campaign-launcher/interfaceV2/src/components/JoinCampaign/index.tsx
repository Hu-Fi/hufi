import { FC, useState } from 'react';

import { Button } from '@mui/material';

import { useGetEnrolledExchanges, useGetJoinedCampaigns, useJoinCampaign } from '../../hooks/recording-oracle';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignDetails } from '../../types';
import AddKeysPromptModal from '../modals/AddKeysPromptModal';

type Props = {
  campaign: CampaignDetails;
};

const JoinCampaign: FC<Props> = ({ campaign }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useWeb3Auth();
  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } = useGetEnrolledExchanges();
  const { data: joinedCampaigns, isLoading: isJoinedCampaignsLoading } = useGetJoinedCampaigns();
  const { mutate: joinCampaign, isPending: isJoinPending } = useJoinCampaign();

  const isAlreadyJoined = joinedCampaigns?.results.some((joinedCampaign) => joinedCampaign.address === campaign.address);

  const isLoading = isEnrolledExchangesLoading || isJoinedCampaignsLoading || isJoinPending;
  const isButtonDisabled = !isAuthenticated || isLoading || isAlreadyJoined;
    
  const handleButtonClick = () => {
    if (isButtonDisabled) {
      return;
    }

    if (!enrolledExchanges || !enrolledExchanges.includes(campaign.exchange_name)) {
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
        sx={{ ml: { xs: 0, md: 'auto' }, color: 'primary.contrast' }}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
      >
        {isAlreadyJoined ? 'Registered to Campaign' : 'Join Campaign'}
      </Button>
      <AddKeysPromptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default JoinCampaign;
