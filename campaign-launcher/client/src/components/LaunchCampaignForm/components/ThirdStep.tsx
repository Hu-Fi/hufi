import { useEffect, type FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { UNLIMITED_AMOUNT } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { AllowanceType, type CampaignFormValues } from '@/types';
import { getTokenInfo, isExceedingMaximumInteger } from '@/utils';

import { formatInputValue } from '../utils';
import { createFundAmountValidationSchema } from '../validation';

import { SummaryCard, BottomNavigation } from './';

const allowanceTooltipText = {
  unlimited:
    'Approve unlimited token amount so you don’t need to approve again for future escrows.',
  custom:
    'You can change this allowance later by sending another approve transaction.',
} as const;

const AllowanceTooltip = ({ type }: { type: AllowanceType }) => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'top' : 'right'}
      title={
        <Typography component="p" variant="tooltip" color="primary.contrast">
          {allowanceTooltipText[type]}
        </Typography>
      }
    >
      <InfoTooltipInner />
    </CustomTooltip>
  );
};

type Props = {
  fundAmount: string;
  setFundAmount: (amount: string) => void;
  formValues: CampaignFormValues;
  handleChangeStep: (step: number) => void;
};

const ThirdStep: FC<Props> = ({
  fundAmount,
  setFundAmount,
  formValues,
  handleChangeStep,
}) => {
  const { fund_token: fundToken } = formValues;
  const isMobile = useIsMobile();

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm<{
    fund_amount: string;
    selected_allowance: AllowanceType;
    custom_allowance_amount: string;
  }>({
    mode: isMobile ? 'onSubmit' : 'onChange',
    resolver: yupResolver(
      createFundAmountValidationSchema(
        formValues.start_date,
        formValues.end_date,
        formValues.fund_token
      )
    ),
    defaultValues: {
      fund_amount: fundAmount,
      selected_allowance: AllowanceType.CUSTOM,
      custom_allowance_amount: '',
    },
    shouldFocusError: isMobile,
  });

  const { selected_allowance, custom_allowance_amount } = watch();

  const {
    approve,
    fetchAllowance,
    allowance: currentAllowance,
    isLoading,
    isApproving,
    reset: resetApproval,
  } = useTokenAllowance();

  const { showError } = useNotification();

  useEffect(() => {
    if (!isLoading && currentAllowance === UNLIMITED_AMOUNT) {
      setValue('selected_allowance', AllowanceType.UNLIMITED);
    }
  }, [isLoading, currentAllowance, setValue]);

  useEffect(() => {
    if (fundToken) {
      fetchAllowance(fundToken);
    }
  }, [fundToken, fetchAllowance]);

  useEffect(() => {
    if (isMobile && errors.fund_amount) {
      const errorElement = document.querySelector(
        '[name="fund_amount"]'
      ) as HTMLElement;
      errorElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isMobile, errors]);

  const onSubmit = async (data: {
    fund_amount: string;
    selected_allowance: AllowanceType;
    custom_allowance_amount: string;
  }) => {
    const { fund_amount, selected_allowance, custom_allowance_amount } = data;
    let canSkipApproval = false;

    if (!custom_allowance_amount) {
      canSkipApproval =
        (selected_allowance === AllowanceType.UNLIMITED &&
          currentAllowance === UNLIMITED_AMOUNT) ||
        (selected_allowance === AllowanceType.CUSTOM &&
          Number(currentAllowance) >= Number(fund_amount));
    }

    if (canSkipApproval) {
      setFundAmount(fund_amount);
      handleChangeStep(4);
      return;
    }

    const amountToApprove =
      selected_allowance === AllowanceType.UNLIMITED
        ? UNLIMITED_AMOUNT
        : custom_allowance_amount || fund_amount;

    const isApproved = await approve(fundToken, amountToApprove);

    if (isApproved) {
      setFundAmount(fund_amount);
      handleChangeStep(4);
      return;
    } else {
      resetApproval();
      showError('Failed to approve tokens, please try again');
      return;
    }
  };

  const inputAdornmentLabel = getTokenInfo(fundToken)?.label || '';

  return (
    <Stack width="100%" mt={{ xs: 0, md: 4 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack
          direction="row"
          justifyContent="space-between"
          gap={{ sm: 3, md: 2 }}
        >
          <Stack maxWidth="500px" width="100%">
            <Stack gap={3}>
              <Typography variant="h6" component="h3">
                Campaign Fund Amount
              </Typography>
              <FormControl
                error={!!errors.fund_amount}
                sx={{
                  width: { xs: '100%', md: '380px' },
                  '& .MuiFormHelperText-root': { mx: 0 },
                }}
              >
                <Controller
                  name="fund_amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      id="fund-amount-input"
                      label="Fund Amount"
                      placeholder="Enter amount"
                      error={!!errors.fund_amount}
                      disabled={isApproving}
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = formatInputValue(e.target.value);
                        if (isExceedingMaximumInteger(value)) {
                          return;
                        }
                        field.onChange(value);
                      }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              {inputAdornmentLabel}
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
                {errors.fund_amount && (
                  <FormHelperText>{errors.fund_amount.message}</FormHelperText>
                )}
                <Typography
                  variant="body2"
                  mt={1}
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  justifyContent={{ xs: 'flex-start', md: 'space-between' }}
                  gap={{ xs: 0.5, md: 0 }}
                >
                  <span>Current allowance:</span>
                  <span>
                    {currentAllowance === UNLIMITED_AMOUNT
                      ? 'Unlimited'
                      : `${currentAllowance ?? 0} ${fundToken.toUpperCase()}`}
                  </span>
                </Typography>
              </FormControl>
            </Stack>
            <Divider sx={{ my: 4 }} />
            <Stack gap={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" component="h3">
                  Token Approval
                </Typography>
                {(isLoading || isApproving) && <CircularProgress size={24} />}
              </Box>
              <FormControl sx={{ display: isLoading ? 'none' : 'flex' }}>
                <Controller
                  name="selected_allowance"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      name="allowance"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value === AllowanceType.UNLIMITED) {
                          setValue('custom_allowance_amount', '');
                        }
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'flex-start',
                        gap: 3,
                      }}
                    >
                      <Stack gap={{ xs: 1, md: 2 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          width="220px"
                          gap={1}
                        >
                          <FormControlLabel
                            value={AllowanceType.CUSTOM}
                            disabled={isApproving}
                            control={<Radio />}
                            label="Limited Allowance"
                            sx={{
                              mr: 0,
                              '& .MuiRadio-root, & .MuiTypography-root': {
                                color:
                                  selected_allowance === AllowanceType.CUSTOM &&
                                  !isApproving
                                    ? 'text.primary'
                                    : 'text.disabled',
                              },
                            }}
                          />
                          <AllowanceTooltip type={AllowanceType.CUSTOM} />
                        </Stack>
                        <FormControl
                          error={!!errors.custom_allowance_amount}
                          sx={{
                            '& .MuiFormHelperText-root': {
                              mx: 0,
                              mt: 0.5,
                              maxWidth: '220px',
                            },
                          }}
                        >
                          <Controller
                            name="custom_allowance_amount"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                size="small"
                                type="number"
                                value={field.value}
                                error={!!errors.custom_allowance_amount}
                                placeholder="i.e 0.00"
                                disabled={
                                  selected_allowance !== AllowanceType.CUSTOM ||
                                  isApproving
                                }
                                sx={{
                                  width: 220,
                                  display:
                                    selected_allowance === AllowanceType.CUSTOM
                                      ? 'flex'
                                      : 'none',
                                }}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  if (rawValue === '') {
                                    field.onChange('');
                                    return;
                                  }
                                  const value = formatInputValue(rawValue);
                                  if (isExceedingMaximumInteger(value)) {
                                    return;
                                  }
                                  field.onChange(value);
                                }}
                                slotProps={{
                                  htmlInput: {
                                    min: 0,
                                    sx: {
                                      fieldSizing: 'content',
                                      maxWidth: '12ch',
                                      minWidth: '1ch',
                                      width: 'unset',
                                    },
                                  },
                                  input: {
                                    endAdornment: custom_allowance_amount ? (
                                      <InputAdornment
                                        position="end"
                                        sx={{
                                          alignSelf: 'flex-end',
                                          margin: 0,
                                          mb: 1,
                                          ml: 0.5,
                                          height: '23px',
                                          opacity:
                                            isApproving ||
                                            selected_allowance !==
                                              AllowanceType.CUSTOM
                                              ? 0.5
                                              : 1,
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        <Typography
                                          variant="body1"
                                          color="text.primary"
                                        >
                                          {inputAdornmentLabel}
                                        </Typography>
                                      </InputAdornment>
                                    ) : null,
                                  },
                                }}
                              />
                            )}
                          />
                          {errors.custom_allowance_amount &&
                            selected_allowance === AllowanceType.CUSTOM && (
                              <FormHelperText>
                                {errors.custom_allowance_amount.message}
                              </FormHelperText>
                            )}
                        </FormControl>
                      </Stack>
                      <Stack
                        direction="row"
                        alignItems="center"
                        width="220px"
                        gap={1}
                      >
                        <FormControlLabel
                          value={AllowanceType.UNLIMITED}
                          disabled={isApproving}
                          control={<Radio />}
                          label="Unlimited Approval"
                          sx={{
                            mr: 0,
                            '& .MuiRadio-root, & .MuiTypography-root': {
                              color:
                                selected_allowance ===
                                  AllowanceType.UNLIMITED && !isApproving
                                  ? 'text.primary'
                                  : 'text.disabled',
                            },
                          }}
                        />
                        <AllowanceTooltip type={AllowanceType.UNLIMITED} />
                      </Stack>
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Stack>
          </Stack>
          {!isMobile && <SummaryCard step={3} formValues={formValues} />}
        </Stack>
        <BottomNavigation
          step={3}
          nextButtonType="submit"
          nextButtonText="Confirm & Preview"
          disableNextButton={isLoading || isApproving}
          disableBackButton={isLoading || isApproving}
          handleNextClick={() => {}}
          handleBackClick={() => handleChangeStep(2)}
        />
      </form>
    </Stack>
  );
};

export default ThirdStep;
