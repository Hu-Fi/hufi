import { FC, useCallback, useEffect, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
  inputBaseClasses,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import * as yup from 'yup';

import { QUERY_KEYS } from '../../../constants/queryKeys';
import { FUND_TOKENS, FundToken } from '../../../constants/tokens';
import { useIsMobile } from '../../../hooks/useBreakpoints';
import useCreateEscrow from '../../../hooks/useCreateEscrow';
import { useTradingPairs } from '../../../hooks/useTradingPairs';
import { useNetwork } from '../../../providers/NetworkProvider';
import { constructCampaignDetails } from '../../../utils';
import { CryptoEntity } from '../../CryptoEntity';
import { CryptoPairEntity } from '../../CryptoPairEntity';
import CustomTooltip from '../../CustomTooltip';
import FormExchangeSelect from '../../FormExchangeSelect';
import InfoTooltipInner from '../../InfoTooltipInner';
import { ModalError, ModalSuccess } from '../../ModalState';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

type CampaignFormValues = {
  exchange: string;
  pair: string;
  start_date: Date;
  end_date: Date;
  fund_token: string;
  fund_amount: number;
  daily_volume_target: number;
};

const mapTokenToMinValue: Record<FundToken, number> = {
  usdt: 0.001,
  usdc: 0.001,
  hmt: 0.1,
}

const validationSchema = yup.object({
  exchange: yup.string().required('Required'),
  pair: yup.string().required('Required'),
  fund_token: yup.string().required('Required'),
  fund_amount: yup
    .number()
    .typeError('Fund amount is required')
    .required('Fund amount is required')
    .test('min-amount', function (value) {
      if (!value) return this.createError({ message: 'Must be greater than 0' });
      const fundToken: FundToken = this.parent.fund_token;
      const minValue = mapTokenToMinValue[fundToken];
      if (value < minValue) {
        return this.createError({
          message:`Minimum amount for ${fundToken.toUpperCase()} is ${minValue}`,
        });
      }

      return true;
    }),
  start_date: yup.date().required('Required'),
  daily_volume_target: yup
    .number()
    .typeError('Daily volume target is required')
    .min(1, 'Daily volume target must be greater than or equal to 1')
    .required('Daily volume target is required'),
  end_date: yup
    .date()
    .required('Required')
    .test(
      'is-after-start',
      'Must be at least one day after start date',
      function (value) {
        if (!value || !this.parent.start_date) return true;

        const startDate = new Date(this.parent.start_date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(value);
        endDate.setHours(0, 0, 0, 0);
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 1);
        return endDate >= minEndDate;
      }
    ),
});

const steps = ['Create Escrow', 'Fund Escrow', 'Setup Escrow'];

const InfoTooltip = () => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'top' : 'right'}
      title={
        <>
          <Typography component="p" variant="tooltip" color="primary.contrast">
            Can&apos;t find the exchange? <br />
            Click the link below to submit a request. <br />
            We&apos;d love to hear from you! <br />
            <Link
              href=""
              target="_blank"
              rel="noopener noreferrer"
              color="primary.contrast"
            >
              Submit request
            </Link>
          </Typography>
        </>
      }
    >
      <InfoTooltipInner />
    </CustomTooltip>
  );
};

const CreateCampaignModal: FC<Props> = ({ open, onClose }) => {
  const [showFinalView, setShowFinalView] = useState(false);
  const { isConnected } = useAccount();
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
    reset,
    getValues,
  } = useForm<CampaignFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      pair: '',
      start_date: new Date(),
      end_date: new Date(),
      fund_token: 'hmt',
      fund_amount: 0.1,
      daily_volume_target: 1,
    },
  });

  const exchange = watch('exchange');
  const pair = watch('pair');
  const { data: tradingPairs, isLoading: isLoadingTradingPairs } =
    useTradingPairs(exchange);

  const submitForm = async (data: CampaignFormValues) => {
    await createEscrow(data);
  };

  const handleTryAgainClick = () => {
    stepsCompleted > 0 ? createEscrow(getValues()) : resetCreateEscrow();
  }

  const handleClose = () => {
    reset();
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
      {showFinalView && (
        <Stack gap={2} alignItems="center" textAlign="center">
          <ModalSuccess />
          <Typography variant="h4" color="text.primary" mt={1}>
            Congratulations!
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            Your campaign has been successfully created.
            <br />
            Everything is set up and ready to go.
          </Typography>
          <Typography variant="body2">
            Click the button below to view the campaign details.
          </Typography>
          <Button
            size="large"
            variant="contained"
            sx={{ mt: 2, mx: 'auto' }}
            onClick={onViewCampaignDetailsClick}
          >
            View campaign details page
          </Button>
        </Stack>
      )}
      {isError && (
        <Stack alignItems="center" textAlign="center">
          <Typography variant="h4" color="text.primary" mb={4}>
            Create Campaign
          </Typography>
          <ModalError />
          <Button
            size="large"
            variant="contained"
            sx={{ mt: 4, mx: 'auto' }}
            onClick={handleTryAgainClick}
          >
            Try again
          </Button>
        </Stack>
      )}
      {!showFinalView && !isError && (
        <form onSubmit={handleSubmit(submitForm)}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Typography variant="h4" color="text.primary" mb={4}>
              Create Campaign
            </Typography>
            <Stepper activeStep={stepsCompleted} sx={{ mb: 4, width: '100%' }}>
              {steps.map((step, idx) => {
                const stepProps: { completed?: boolean } = {};
                if (idx < stepsCompleted) {
                  stepProps.completed = true;
                }
                return (
                  <Step key={step} {...stepProps}>
                    <StepLabel
                      slotProps={{
                        stepIcon: {
                          icon:
                            isCreatingEscrow && idx === stepsCompleted ? (
                              <CircularProgress size={24} />
                            ) : (
                              idx + 1
                            ),
                          sx: {
                            '&.Mui-completed': {
                              color: 'success.main',
                            },
                          },
                        },
                      }}
                    >
                      {step}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Box
              display="flex"
              flexDirection="column"
              gap={3}
              width={{ xs: '100%', sm: 625 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <Box display="flex" gap={2} alignItems="center" width="100%">
                  <FormControl error={!!errors.exchange} sx={{ width: '100%' }}>
                    <Controller
                      name="exchange"
                      control={control}
                      render={({ field }) => (
                        <FormExchangeSelect<CampaignFormValues, 'exchange'>
                          field={field}
                          disabled={isCreatingEscrow}
                        />
                      )}
                    />
                    {errors.exchange && (
                      <FormHelperText>{errors.exchange.message}</FormHelperText>
                    )}
                  </FormControl>
                  <InfoTooltip />
                </Box>
                <FormControl error={!!errors.pair} sx={{ width: '100%' }}>
                  <Controller
                    name="pair"
                    control={control}
                    render={({ field }) => {
                      return (
                        <Autocomplete
                          id="trading-pair-select"
                          options={tradingPairs || []}
                          loading={isLoadingTradingPairs}
                          slotProps={{
                            paper: {
                              elevation: 4,
                              sx: {
                                bgcolor: 'background.default',
                              },
                            },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Trading Pair"
                              disabled={isCreatingEscrow}
                              slotProps={{
                                input: {
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {isLoadingTradingPairs ? (
                                        <CircularProgress size={20} />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => {
                            return (
                              <Box
                                {...props}
                                key={option}
                                component="li"
                                sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                              >
                                <CryptoPairEntity symbol={option} />
                              </Box>
                            );
                          }}
                          {...field}
                          onChange={(_, value) => field.onChange(value)}
                        />
                      );
                    }}
                  />
                  {errors.pair && (
                    <FormHelperText>{errors.pair.message}</FormHelperText>
                  )}
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <FormControl error={!!errors.start_date} sx={{ width: '100%' }}>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Start Date"
                        format="YYYY-MM-DD"
                        closeOnSelect
                        disablePast
                        {...field}
                        disabled={isCreatingEscrow}
                        value={dayjs(field.value)}
                      />
                    )}
                  />
                  {errors.start_date && (
                    <FormHelperText>{errors.start_date.message}</FormHelperText>
                  )}
                </FormControl>
                <FormControl error={!!errors.end_date} sx={{ width: '100%' }}>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="End Date"
                        format="YYYY-MM-DD"
                        closeOnSelect
                        disablePast
                        {...field}
                        disabled={isCreatingEscrow}
                        value={dayjs(field.value)}
                      />
                    )}
                  />
                  {errors.end_date && (
                    <FormHelperText>{errors.end_date.message}</FormHelperText>
                  )}
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <FormControl error={!!errors.fund_token} sx={{ width: '100%' }}>
                  <InputLabel id="fund-token-select-label">
                    Fund Token
                  </InputLabel>
                  <Controller
                    name="fund_token"
                    control={control}
                    render={({ field }) => (
                      <Select
                        labelId="fund-token-select-label"
                        id="fund-token-select"
                        label="Fund Token"
                        MenuProps={{
                          PaperProps: {
                            elevation: 4,
                            sx: {
                              bgcolor: 'background.default',
                            },
                          },
                        }}
                        {...field}
                        disabled={isCreatingEscrow}
                      >
                        {
                          FUND_TOKENS.map((token) => (
                            <MenuItem key={token} value={token}>
                              <CryptoEntity name={token} />
                            </MenuItem>
                          ))
                        }
                      </Select>
                    )}
                  />

                  {errors.fund_token && (
                    <FormHelperText>{errors.fund_token.message}</FormHelperText>
                  )}
                </FormControl>
                <FormControl
                  error={!!errors.fund_amount}
                  sx={{ width: '100%' }}
                >
                  <Controller
                    name="fund_amount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        id="fund-amount-input"
                        label="Fund Amount"
                        error={!!errors.fund_amount}
                        type="number"
                        {...field}
                        disabled={isCreatingEscrow}
                      />
                    )}
                  />
                  {errors.fund_amount && (
                    <FormHelperText>
                      {errors.fund_amount.message}
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl
                  error={!!errors.daily_volume_target}
                  sx={{ width: '100%' }}
                >
                  <Controller
                    name="daily_volume_target"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        id="daily-volume-target-input"
                        label="Daily Volume Target"
                        type="number"
                        error={!!errors.daily_volume_target}
                        {...field}
                        disabled={isCreatingEscrow}
                        slotProps={{
                          htmlInput: {
                            sx: {
                              fieldSizing: 'content',
                              maxWidth: '12ch',
                              minWidth: '1ch',
                              width: 'unset',
                              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                                {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                            },
                          },
                          input: {
                            endAdornment: (
                              <InputAdornment
                                position="end"
                                sx={{
                                  alignSelf: 'flex-end',
                                  margin: 0,
                                  mb: 2,
                                  ml: 0.5,
                                  height: '23px',
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  [`[data-shrink=true] ~ .${inputBaseClasses.root} > &`]:
                                    {
                                      opacity: isCreatingEscrow ? 0.5 : 1,
                                    },
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                >
                                  {pair?.split('/')[1] || ''}
                                </Typography>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  {errors.daily_volume_target && (
                    <FormHelperText>
                      {errors.daily_volume_target.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
              {stepsCompleted < steps.length ? (
                <Button
                  size="large"
                  variant="contained"
                  type="submit"
                  sx={{ mx: 'auto' }}
                  disabled={!isConnected || isCreatingEscrow}
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
