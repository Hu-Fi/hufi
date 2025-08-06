import { FC, useState } from 'react';

import { Button } from '@mui/material';

import { useGetEnrolledExchanges, useGetJoinedCampaigns, useJoinCampaign } from '../../hooks/recording-oracle';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignDetails } from '../../types';
import JoinCampaignModal from '../modals/JoinCampaignModal';

type Props = {
  campaign: CampaignDetails;
};

const JoinCampaign: FC<Props> = ({ campaign }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useWeb3Auth();
  const { data: enrolledExchanges } = useGetEnrolledExchanges();
  const { data: joinedCampaigns } = useGetJoinedCampaigns();
  const { mutate: joinCampaign, isPending } = useJoinCampaign();

  const isAlreadyJoined = joinedCampaigns?.campaigns.some((joinedCampaign) => joinedCampaign.address === campaign.address);

  const isButtonDisabled = !isAuthenticated || isPending || isAlreadyJoined;
    
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
      <JoinCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default JoinCampaign;
