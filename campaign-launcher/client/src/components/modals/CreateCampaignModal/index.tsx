import { FC, useCallback, useEffect, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Control, useForm, UseFormWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { ErrorView, FinalView, HoldingForm, MarketMakingForm, Steps } from './components';
import { getFormDefaultValues } from './utils';
import { campaignValidationSchema } from './validation';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import useCreateEscrow from '../../../hooks/useCreateEscrow';
import { useNetwork } from '../../../providers/NetworkProvider';
import { CampaignFormValues, HoldingFormValues, MarketMakingFormValues , CampaignType } from '../../../types';
import { constructCampaignDetails } from '../../../utils';
import CampaignTypeLabel from '../../CampaignTypeLabel';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  campaignType: CampaignType;
};

const steps = ['Create Escrow', 'Fund Escrow', 'Setup Escrow'];

const CreateCampaignModal: FC<Props> = ({ open, onClose, campaignType }) => {
  const [showFinalView, setShowFinalView] = useState(false);
  const navigate = useNavigate();
  const {
    data: escrowData,
    stepsCompleted,
    mutate: createEscrow,
    reset: resetCreateEscrow,
    isLoading: isCreatingEscrow,
    isError,
  } = useCreateEscrow();
  const queryClient = useQueryClient();
  const { appChainId } = useNetwork();

  const isCampaignCreated = stepsCompleted === steps.length;

  useEffect(() => {
    if (isCampaignCreated) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_CAMPAIGNS] });
    }
  }, [isCampaignCreated]);

  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
    reset: resetForm,
    getValues,
  } = useForm<CampaignFormValues>({
    resolver: yupResolver(campaignValidationSchema),
    defaultValues: getFormDefaultValues(campaignType),
  });

  const submitForm = async (data: CampaignFormValues) => {
    await createEscrow(data);
  };

  const handleTryAgainClick = () => {
    stepsCompleted > 0 ? createEscrow(getValues()) : resetCreateEscrow();
  }

  const handleClose = () => {
    resetForm();
    resetCreateEscrow();
    onClose();
  };

  const onViewCampaignDetailsClick = useCallback(() => {
    if (!escrowData) return;

    const formData = getValues();
    const {
      escrowAddress,
      tokenDecimals,
      exchangeOracleFee,
      recordingOracleFee,
      reputationOracleFee,
    } = escrowData;
    const fees = {
      exchangeOracleFee: exchangeOracleFee,
      recordingOracleFee: recordingOracleFee,
      reputationOracleFee: reputationOracleFee,
    };
    const payload = constructCampaignDetails({
      chainId: appChainId,
      address: escrowAddress,
      data: formData,
      tokenDecimals,
      fees,
    });
    const encodedData = btoa(JSON.stringify(payload));
    navigate(`/campaign-details/${escrowAddress}?data=${encodedData}`);
    setShowFinalView(false);
    handleClose();
  }, [escrowData]);

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {showFinalView && <FinalView onViewDetails={onViewCampaignDetailsClick} />}
      {isError && <ErrorView onRetry={handleTryAgainClick} />}
      {!showFinalView && !isError && (
        <form onSubmit={handleSubmit(submitForm)}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Typography variant="h4" color="text.primary">
              Create Campaign
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="subtitle2" color="text.secondary">Campaign Type:</Typography>
              <CampaignTypeLabel campaignType={campaignType} />
            </Box>
            <Steps stepsCompleted={stepsCompleted} steps={steps} isCreatingEscrow={isCreatingEscrow} />
            <Box
              display="flex"
              flexDirection="column"
              gap={3}
              width={{ xs: '100%', sm: 625 }}
            >
              {campaignType === CampaignType.MARKET_MAKING && (
                <MarketMakingForm 
                  control={control as Control<MarketMakingFormValues>} 
                  errors={errors} 
                  watch={watch as UseFormWatch<MarketMakingFormValues>} 
                  isCreatingEscrow={isCreatingEscrow} 
                />
              )}
              {campaignType === CampaignType.HOLDING && (
                <HoldingForm 
                  control={control as Control<HoldingFormValues>} 
                  errors={errors} 
                  watch={watch as UseFormWatch<HoldingFormValues>} 
                  isCreatingEscrow={isCreatingEscrow} 
                />
              )}
              {stepsCompleted < steps.length ? (
                <Button
                  size="large"
                  variant="contained"
                  type="submit"
                  sx={{ mx: 'auto' }}
                  disabled={isCreatingEscrow}
                >
                  Create Campaign
                </Button>
              ) : (
                <Button
                  size="large"
                  variant="contained"
                  sx={{ mx: 'auto' }}
                  onClick={() => setShowFinalView(true)}
                >
                  Finish
                </Button>
              )}
            </Box>
          </Box>
        </form>
      )}
    </BaseModal>
  );
};

export default CreateCampaignModal;
