import { type FC, useCallback, useEffect, useRef, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  useForm,
  type Control,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import CampaignTypeLabel from '@/components/CampaignTypeLabel';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import useCreateEscrow from '@/hooks/useCreateEscrow';
import { useNetwork } from '@/providers/NetworkProvider';
import {
  CampaignType,
  type ThresholdFormValues,
  type CampaignFormValues,
  type HoldingFormValues,
  type MarketMakingFormValues,
} from '@/types';
import { constructCampaignDetails } from '@/utils';

import BaseModal from '../BaseModal';

import {
  ErrorView,
  FinalView,
  HoldingForm,
  MarketMakingForm,
  Steps,
  ThresholdForm,
} from './components';
import { getFormDefaultValues } from './utils';
import { campaignValidationSchema } from './validation';

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
  const isMobile = useIsMobile();
  const formValuesRef = useRef<CampaignFormValues | null>(null);
  const isCampaignCreated = stepsCompleted === steps.length;

  useEffect(() => {
    if (isCampaignCreated) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_CAMPAIGNS] });
    }
  }, [queryClient, isCampaignCreated]);

  const {
    control,
    formState: { errors },
    watch,
    trigger,
    handleSubmit,
    reset: resetForm,
  } = useForm<CampaignFormValues>({
    mode: 'onBlur',
    resolver: yupResolver(campaignValidationSchema),
    defaultValues: getFormDefaultValues(campaignType),
  });

  const submitForm = async (data: CampaignFormValues) => {
    formValuesRef.current = data;
    await createEscrow(data);
  };

  const handleTryAgainClick = useCallback(() => {
    if (stepsCompleted > 0) {
      if (formValuesRef.current) {
        createEscrow(formValuesRef.current);
      }
    } else {
      formValuesRef.current = null;
      resetCreateEscrow();
    }
  }, [stepsCompleted, createEscrow, resetCreateEscrow]);

  const handleClose = useCallback(() => {
    formValuesRef.current = null;
    resetForm();
    resetCreateEscrow();
    onClose();
  }, [resetForm, resetCreateEscrow, onClose]);

  const onViewCampaignDetailsClick = useCallback(() => {
    if (!escrowData || !formValuesRef.current) return;

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
      data: formValuesRef.current,
      tokenDecimals,
      fees,
    });
    const encodedData = btoa(JSON.stringify(payload));
    navigate(`/campaign-details/${escrowAddress}?data=${encodedData}`);
    setShowFinalView(false);
    handleClose();
  }, [appChainId, handleClose, navigate, escrowData]);

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      isLoading={isCreatingEscrow}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        '& > form': {
          width: { xs: '100%', md: 'auto' },
        },
      }}
    >
      {showFinalView && (
        <FinalView
          campaignType={campaignType}
          onViewDetails={onViewCampaignDetailsClick}
        />
      )}
      {isError && <ErrorView onRetry={handleTryAgainClick} />}
      {!showFinalView && !isError && (
        <form onSubmit={handleSubmit(submitForm)}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Typography
              variant="h4"
              color="text.primary"
              textAlign="center"
              sx={{ whiteSpace: 'pre-line' }}
            >
              {isMobile ? 'Launch\nCampaign' : 'Create Campaign'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {!isMobile && (
                <Typography variant="subtitle2" color="text.secondary">
                  Campaign Type:
                </Typography>
              )}
              <CampaignTypeLabel campaignType={campaignType} />
            </Box>
            {!isMobile && (
              <Steps
                stepsCompleted={stepsCompleted}
                steps={steps}
                isCreatingEscrow={isCreatingEscrow}
              />
            )}
            <Box
              display="flex"
              flexDirection="column"
              gap={3}
              width={{ xs: '100%', sm: 625 }}
              sx={{
                '& .MuiFormHelperText-root': {
                  mx: 1,
                  whiteSpace: 'pre-line',
                },
              }}
            >
              {isMobile && isCreatingEscrow && (
                <Steps
                  stepsCompleted={stepsCompleted}
                  steps={steps}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.MARKET_MAKING && (
                <MarketMakingForm
                  control={control as Control<MarketMakingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<MarketMakingFormValues>}
                  trigger={trigger as UseFormTrigger<MarketMakingFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.HOLDING && (
                <HoldingForm
                  control={control as Control<HoldingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<HoldingFormValues>}
                  trigger={trigger as UseFormTrigger<HoldingFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.THRESHOLD && (
                <ThresholdForm
                  control={control as Control<ThresholdFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<ThresholdFormValues>}
                  trigger={trigger as UseFormTrigger<ThresholdFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {stepsCompleted < steps.length ? (
                <Button
                  size="large"
                  variant="contained"
                  type="submit"
                  fullWidth={isMobile}
                  sx={{ mx: { xs: 0, md: 'auto' } }}
                  disabled={isCreatingEscrow}
                >
                  Create Campaign
                </Button>
              ) : (
                <Button
                  size="large"
                  variant="contained"
                  fullWidth={isMobile}
                  sx={{ mx: { xs: 0, md: 'auto' } }}
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
