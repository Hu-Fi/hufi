import { FC, useState } from 'react';

import { Button } from '@mui/material';
import { useAccount } from 'wagmi';

import type { CampaignDataDto } from '../../api/client';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { ExchangeType } from '../../types';
import JoinCampaignModal from '../modals/JoinCampaignModal';

type Props = {
  campaign: CampaignDataDto;
};

const JoinCampaign: FC<Props> = ({ campaign }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const { exchangesMap } = useExchangesContext();

  const exchange = exchangesMap.get(campaign.exchangeName.toLowerCase());

  const isButtonDisabled = !isConnected;
    
  const handleButtonClick = () => {
    if (isButtonDisabled) {
      return;
    }

    if (exchange?.type === ExchangeType.CEX) {
      setModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        size="large"
        sx={{ ml: { xs: 0, md: 'auto' }, color: 'primary.contrast', fontWeight: 600 }}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
      >
        Join Campaign
      </Button>
      <JoinCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        handleSubmitKeys={() => {}}
      />
    </>
  );
};

export default JoinCampaign;
