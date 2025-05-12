import { FC, useState } from 'react';

import { Button } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import type { CampaignDataDto } from '../../api/client';
import {
  useJoinCampaign,
  useRegisterExchangeAPIKey,
  useUserCampaignStatus,
  useUserExchangeAPIKeyExists,
} from '../../hooks/recording-oracle';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { ExchangeType } from '../../types';
import JoinCampaignModal from '../modals/JoinCampaignModal';

type Props = {
  campaign: CampaignDataDto;
};

const JoinCampaign: FC<Props> = ({ campaign }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { exchanges } = useExchangesContext();
  const queryClient = useQueryClient();

  const exchange = exchanges?.find(
    (exchange) =>
      exchange.name?.toLowerCase() === campaign?.exchangeName.toLowerCase()
  );

  const {
    isRegistered,
    isLoading: isROCampaignStatusLoading,
    fetchUserCampaignStatus,
  } = useUserCampaignStatus(campaign.address!);
  const {
    joinCampaignAsync,
    isLoading: isJoinCampaignLoading,
  } = useJoinCampaign({
    onSuccess: () => {
      fetchUserCampaignStatus();
      queryClient.invalidateQueries({ queryKey: ['user-joined-campaigns'] });
    },
  });

  const {
    registerExchangeAPIKeyAsync,
    isLoading: isRegisterExchangeAPIKeyLoading,
  } = useRegisterExchangeAPIKey({
    onSuccess: async () => {
      if (campaign) {
        await joinCampaignAsync(campaign.address);
      }
    },
  });

  const { data: userExchangeAPIKeyExists } = useUserExchangeAPIKeyExists(
    address,
    campaign?.exchangeName
  );

  const isButtonDisabled =
    !isConnected ||
    isRegistered ||
    isROCampaignStatusLoading ||
    isJoinCampaignLoading ||
    isRegisterExchangeAPIKeyLoading;

  const handleButtonClick = () => {
    if (isButtonDisabled) {
      return;
    }

    if (exchange?.type === ExchangeType.CEX && !userExchangeAPIKeyExists) {
      setModalOpen(true);
    } else {
      campaign?.address && joinCampaignAsync(campaign.address);
    }
  };

  const handleSubmitKeys = async (apiKey: string, secret: string) => {
    setModalOpen(false);

    if (!campaign?.exchangeName) {
      return;
    }

    await registerExchangeAPIKeyAsync(campaign?.exchangeName, apiKey, secret);
  };

  return (
    <>
      <Button
        variant="contained"
        size="large"
        sx={{ ml: 'auto', color: 'primary.contrast', fontWeight: 600 }}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
      >
        {isRegistered ? 'Registered to Campaign' : 'Join Campaign'}
      </Button>
      <JoinCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        handleSubmitKeys={handleSubmitKeys}
      />
    </>
  );
};

export default JoinCampaign;
