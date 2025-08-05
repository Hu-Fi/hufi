import { FC, useEffect, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import * as yup from 'yup';

import { FUND_TOKENS, TOKENS } from '../../../constants/tokens';
import useCreateEscrow from '../../../hooks/useCreateEscrow';
import { useTradingPairs } from '../../../hooks/useTradingPairs';
import { CryptoEntity } from '../../CryptoEntity';
import { CryptoPairEntity } from '../../CryptoPairEntity';
import FormExchangeSelect from '../../FormExchangeSelect';
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
};

const validationSchema = yup.object({
  exchange: yup.string().required('Required'),
  pair: yup.string().required('Required'),
  fund_token: yup.string().required('Required'),
  fund_amount: yup.number().required('Required'),
  start_date: yup.date().required('Required'),
  end_date: yup
    .date()
    .required('Required')
    .test(
      'is-after-start',
      'Must be at least one day after start date',
      function (value) {
        if (!value || !this.parent.startDate) return true;

        const startDate = new Date(this.parent.startDate);
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

const slotProps = {
  paper: {
    elevation: 4,
    sx: {
      bgcolor: 'background.default',
    },
  },
};

const menuProps = {
  PaperProps: {
    elevation: 4,
    sx: {
      bgcolor: 'background.default',
    },
  },
};

const InfoTooltip = () => {
  return (
    <Tooltip 
      arrow placement="right"
      title={
        <>
          <Typography component="p" variant="tooltip" color="primary.contrast">
            Can&apos;t find the exchange? <br />
            Click the link below to submit a request. <br />
            We&apos;d love to hear from you! <br />
            <Link href="" target="_blank" rel="noopener noreferrer" color="primary.contrast">
              Submit request
            </Link>
          </Typography>
        </>
      }
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'primary.main',
          },
        },
        arrow: {
          sx: {
            '&::before': {
              bgcolor: 'primary.main',
            },
          },
        },
      }}
    >
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        py={0.5} 
        px={1.5}
        borderRadius="100%"
        sx={{
          background: 'linear-gradient(13deg, rgba(247, 248, 253, 0.05) 20.33%, rgba(255, 255, 255, 0.05) 48.75%)',
          cursor: 'pointer',
        }}
      >
        <Typography component="span" variant="subtitle2" color="text.secondary">
          i
        </Typography>
      </Box>
    </Tooltip>
  )
};

const CreateCampaignModal: FC<Props> = ({ open, onClose }) => {
  const [activeStep] = useState(0);
  const account = useAccount();
  const {
    isLoading: isCreatingEscrow,
    createEscrow,
    stepsCompleted,
  } = useCreateEscrow();
  const queryClient = useQueryClient();

  const isCampaignCreated = stepsCompleted === steps.length;

  useEffect(() => {
    if (isCampaignCreated) {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
    }
  }, [isCampaignCreated]);

  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
  } = useForm<CampaignFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      pair: '',
      start_date: new Date(),
      end_date: new Date(),
      fund_token: 'hmt',
      fund_amount: 0.0001,
    },
  });

  const exchange = watch('exchange');
  const { data: tradingPairs } = useTradingPairs(exchange);

  const submitForm = async (data: CampaignFormValues) => {
    await createEscrow(data);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form onSubmit={handleSubmit(submitForm)}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h4" color="text.primary" mb={4}>
            Create Campaign
          </Typography>
          <Stepper activeStep={activeStep} sx={{ mb: 4, width: '100%' }}>
            {steps.map((step, idx) => {
              const stepProps: { completed?: boolean } = {};
              const isAllCompleted = stepsCompleted === 4 && idx === 3;
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
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: isAllCompleted ? 'success.main' : 'inherit',
                      },
                    }}
                  >
                    {isAllCompleted ? 'Completed' : step}
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
            <Box display="flex" gap={2}>
              <Box display="flex" gap={2} alignItems="center" width="100%">
                <FormControl error={!!errors.exchange} sx={{ width: '100%' }}>
                  <Controller
                    name="exchange"
                    control={control}
                    render={({ field }) => <FormExchangeSelect<CampaignFormValues, 'exchange'> field={field} />}
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
                        slotProps={slotProps}
                        renderInput={(params) => (
                          <TextField {...params} label="Trading Pair" />
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
            </Box>
            <Box display="flex" gap={2}>
              <FormControl error={!!errors.start_date} sx={{ width: '100%' }}>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Start Date"
                      closeOnSelect
                      disablePast
                      {...field}
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
                      closeOnSelect
                      disablePast
                      {...field}
                      value={dayjs(field.value)}
                    />
                  )}
                />
                {errors.end_date && (
                  <FormHelperText>{errors.end_date.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <FormControl error={!!errors.fund_token} sx={{ width: '100%' }}>
                <InputLabel id="fund-token-select-label">Fund Token</InputLabel>
                <Controller
                  name="fund_token"
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId="fund-token-select-label"
                      id="fund-token-select"
                      label="Fund Token"
                      MenuProps={menuProps}
                      {...field}
                    >
                      {TOKENS.filter((token) =>
                        FUND_TOKENS.includes(token.name)
                      ).map((token) => (
                        <MenuItem key={token.name} value={token.name}>
                          <CryptoEntity name={token.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />

                {errors.fund_token && (
                  <FormHelperText>{errors.fund_token.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.fund_amount} sx={{ width: '100%' }}>
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
                    />
                  )}
                />
                {errors.fund_amount && (
                  <FormHelperText>{errors.fund_amount.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            {stepsCompleted < steps.length ? (
              <Button
                variant="contained"
                type="submit"
                sx={{ width: '185px', mx: 'auto' }}
                disabled={!account.isConnected || isCreatingEscrow}
              >
                Create Campaign
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ width: '185px', mx: 'auto' }}
                onClick={onClose}
              >
                Finish
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </BaseModal>
  );
};

export default CreateCampaignModal;
