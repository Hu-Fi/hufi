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
  MenuItem,
  Select,
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
import { useAccount } from 'wagmi';
import * as yup from 'yup';

import { FUND_TOKENS, TOKENS } from '../../../constants/tokens';
import useCreateEscrow from '../../../hooks/useCreateEscrow';
import { useSymbols } from '../../../hooks/useSymbols';
import { useExchangesContext } from '../../../providers/ExchangesProvider';
import { ExchangeType } from '../../../types';
import { CryptoEntity } from '../../CryptoEntity';
import { CryptoPairEntity } from '../../CryptoPairEntity';
import FormExchangeSelect from '../../FormExchangeSelect';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

type CampaignFormValues = {
  chainId: number;
  exchangeName: string;
  requesterAddress: string;
  token: string;
  startDate: Date;
  endDate: Date;
  fundToken: string;
  fundAmount: number;
};

const validationSchema = yup.object({
  chainId: yup.number().required('Required'),
  exchangeName: yup.string().required('Required'),
  requesterAddress: yup.string().required('Required'),
  token: yup.string().required('Required'),
  startDate: yup.date().required('Required'),
  endDate: yup
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
  fundToken: yup.string().required('Required'),
  fundAmount: yup.number().required('Required'),
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

const CreateCampaignModal: FC<Props> = ({ open, onClose }) => {
  const [activeStep] = useState(0);
  const { exchangesMap } = useExchangesContext();
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
      chainId: account.chainId,
      requesterAddress: account.address,
      exchangeName: '',
      token: '',
      startDate: new Date(),
      endDate: new Date(),
      fundToken: 'hmt',
      fundAmount: 0.0001,
    },
  });

  const exchangeName = watch('exchangeName');
  const exchange = exchangesMap.get(exchangeName);
  const { data: symbols } = useSymbols(exchangeName);

  const submitForm = async ({ fundToken, ...data }: CampaignFormValues) => {
    await createEscrow(fundToken, {
      ...data,
      fundAmount: data.fundAmount.toString(),
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
    });
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
              <FormControl error={!!errors.exchangeName} sx={{ width: '100%' }}>
                <Controller
                  name="exchangeName"
                  control={control}
                  render={({ field }) => <FormExchangeSelect<CampaignFormValues, 'exchangeName'> field={field} />}
                />
                {errors.exchangeName && (
                  <FormHelperText>{errors.exchangeName.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.token} sx={{ width: '100%' }}>
                {exchange?.type === ExchangeType.CEX ? (
                  <>
                    <Controller
                      name="token"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Autocomplete
                            id="trading-pair-select"
                            options={symbols || []}
                            slotProps={slotProps}
                            renderInput={(params) => (
                              <TextField {...params} label="Trading Pair" />
                            )}
                            renderOption={(props, option) => {
                              // eslint-disable-next-line react/prop-types
                              const { key, ...optionProps } = props;

                              return (
                                <Box
                                  key={key}
                                  component="li"
                                  sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                  {...optionProps}
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
                  </>
                ) : (
                  <>
                    <InputLabel id="token-a-select-label">Token</InputLabel>
                    <Controller
                      name="token"
                      control={control}
                      render={({ field }) => (
                        <Select
                          labelId="token-a-select-label"
                          id="token-a-select"
                          label="Token A"
                          MenuProps={menuProps}
                          {...field}
                        >
                          {TOKENS.map((token) => (
                            <MenuItem key={token.name} value={token.name}>
                              <CryptoEntity name={token.name} />
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </>
                )}
                {errors.token && (
                  <FormHelperText>{errors.token.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <FormControl error={!!errors.startDate} sx={{ width: '100%' }}>
                <Controller
                  name="startDate"
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
                {errors.startDate && (
                  <FormHelperText>{errors.startDate.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.endDate} sx={{ width: '100%' }}>
                <Controller
                  name="endDate"
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
                {errors.endDate && (
                  <FormHelperText>{errors.endDate.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <FormControl error={!!errors.token} sx={{ width: '100%' }}>
                <InputLabel id="fund-token-select-label">Fund Token</InputLabel>
                <Controller
                  name="fundToken"
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

                {errors.fundToken && (
                  <FormHelperText>{errors.fundToken.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.fundAmount} sx={{ width: '100%' }}>
                <Controller
                  name="fundAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      id="fund-amount-input"
                      label="Fund Amount"
                      error={!!errors.fundAmount}
                      type="number"
                      {...field}
                    />
                  )}
                />
                {errors.fundAmount && (
                  <FormHelperText>{errors.fundAmount.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
            {stepsCompleted < 4 ? (
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
