import { useCallback, useEffect, type FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import CheckIcon from '@mui/icons-material/CheckCircle';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  useForm,
  type Control,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import CampaignTypeLabel from '@/components/CampaignTypeLabel';
import { UNLIMITED_AMOUNT } from '@/constants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import useCreateEscrow from '@/hooks/useCreateEscrow';
import { useNotification } from '@/hooks/useNotification';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { useNetwork } from '@/providers/NetworkProvider';
import {
  type HoldingFormValues,
  type ThresholdFormValues,
  type CampaignFormValues,
  CampaignType,
  type MarketMakingFormValues,
} from '@/types';
import { constructCampaignDetails } from '@/utils';

import { getFormDefaultValues } from '../utils';
import { campaignValidationSchema } from '../validation';

import {
  ErrorView,
  FinalView,
  HoldingForm,
  MarketMakingForm,
  Steps,
  ThresholdForm,
} from './';

type FormValues = {
  campaignType: CampaignType;
  fundToken: string;
  fundAmount: string;
};

type Props = {
  formValues: FormValues;
  showFinalView: boolean;
  setShowFinalView: (showFinalView: boolean) => void;
  handleChangeLoading: (isLoading: boolean) => void;
  handleCloseModal: () => void;
};

const SecondStep: FC<Props> = ({
  formValues,
  showFinalView,
  setShowFinalView,
  handleChangeLoading,
  handleCloseModal,
}) => {
  const { campaignType, fundToken, fundAmount } = formValues;
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { appChainId } = useNetwork();
  const navigate = useNavigate();
  const { fetchAllowance } = useTokenAllowance();
  const { showError } = useNotification();

  const {
    data: escrowData,
    mutate: createEscrow,
    reset: resetCreateEscrow,
    isLoading: isCreatingEscrow,
    isSuccess: isEscrowCreated,
    isError,
  } = useCreateEscrow();

  const {
    control,
    formState: { errors },
    watch,
    trigger,
    handleSubmit,
    reset: resetForm,
    getValues,
  } = useForm<CampaignFormValues>({
    mode: 'onBlur',
    resolver: yupResolver(campaignValidationSchema),
    defaultValues: {
      ...getFormDefaultValues(campaignType as CampaignType),
      fund_token: fundToken,
      fund_amount: fundAmount,
    },
  });

  const onCloseModal = useCallback(() => {
    resetForm();
    resetCreateEscrow();
    handleCloseModal();
  }, [resetForm, resetCreateEscrow, handleCloseModal]);

  useEffect(() => {
    handleChangeLoading(isCreatingEscrow);
  }, [isCreatingEscrow, handleChangeLoading]);

  useEffect(() => {
    if (isEscrowCreated) {
      setShowFinalView(true);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_CAMPAIGNS] });
    }
  }, [queryClient, isEscrowCreated, setShowFinalView]);

  const submitForm = async (data: CampaignFormValues) => {
    const allowance = await fetchAllowance(data.fund_token);
    if (
      !allowance ||
      (allowance !== UNLIMITED_AMOUNT &&
        Number(allowance) < Number(data.fund_amount))
    ) {
      showError('Insufficient allowance, go back to the previous step');
      return;
    }
    await createEscrow(data);
  };

  const handleTryAgainClick = useCallback(() => {
    resetCreateEscrow();
  }, [resetCreateEscrow]);

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
    onCloseModal();
    setShowFinalView(false);
  }, [
    appChainId,
    navigate,
    escrowData,
    getValues,
    onCloseModal,
    setShowFinalView,
  ]);

  return (
    <Stack
      alignItems="center"
      sx={{
        width: '100%',
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
      {!isError && !showFinalView && (
        <form onSubmit={handleSubmit(submitForm)}>
          <Stack gap={2} alignItems="center">
            <Typography
              variant="h4"
              color="text.primary"
              textAlign="center"
              sx={{ whiteSpace: 'pre-line' }}
            >
              {isMobile ? 'Launch\nCampaign' : 'Launch Campaign'}
            </Typography>
            <Typography
              variant="alert"
              color="text.secondary"
              mx="auto"
              display="flex"
              alignItems="center"
              gap={1}
            >
              Staked HMT
              <CheckIcon sx={{ color: 'success.main' }} />
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
                stepsCompleted={isEscrowCreated ? 2 : 1}
                isLoading={isCreatingEscrow}
              />
            )}
            <Stack
              mt={2}
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
                  stepsCompleted={isEscrowCreated ? 2 : 1}
                  isLoading={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.MARKET_MAKING && (
                <MarketMakingForm
                  campaignType={CampaignType.MARKET_MAKING}
                  control={control as Control<MarketMakingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<MarketMakingFormValues>}
                  trigger={trigger as UseFormTrigger<MarketMakingFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.HOLDING && (
                <HoldingForm
                  campaignType={CampaignType.HOLDING}
                  control={control as Control<HoldingFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<HoldingFormValues>}
                  trigger={trigger as UseFormTrigger<HoldingFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              {campaignType === CampaignType.THRESHOLD && (
                <ThresholdForm
                  campaignType={CampaignType.THRESHOLD}
                  control={control as Control<ThresholdFormValues>}
                  errors={errors}
                  watch={watch as UseFormWatch<ThresholdFormValues>}
                  trigger={trigger as UseFormTrigger<ThresholdFormValues>}
                  isCreatingEscrow={isCreatingEscrow}
                />
              )}
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
              >
                {!isMobile && (
                  <Button
                    size="large"
                    variant="outlined"
                    disabled={isCreatingEscrow}
                    onClick={onCloseModal}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="large"
                  variant="contained"
                  type="submit"
                  fullWidth={isMobile}
                  disabled={isCreatingEscrow}
                >
                  Create Campaign
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </form>
      )}
    </Stack>
  );
};

export default SecondStep;
