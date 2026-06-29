import {
  type SetStateAction,
  type Dispatch,
  useEffect,
  type FC,
  useState,
} from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
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
import FormattedNumber from '@/components/FormattedNumber';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import RewardsDistribution from '@/components/RewardsDistribution';
import { UNLIMITED_AMOUNT } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { AllowanceType, CampaignType, type CampaignFormValues } from '@/types';
import {
  getCompactNumberParts,
  getOrdinalSuffix,
  getTokenInfo,
  isExceedingMaximumInteger,
} from '@/utils';

import { formatInputValue } from '../utils';
import {
  type ApprovalFormValues,
  createFundAmountValidationSchema,
} from '../validation';

import { BottomNavigation } from './';

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
        <Typography variant="tooltip">{allowanceTooltipText[type]}</Typography>
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
  setFormValues: (values: CampaignFormValues) => void;
  handleChangeStep: Dispatch<SetStateAction<number>>;
};

const ApprovalStep: FC<Props> = ({
  fundAmount,
  setFundAmount,
  formValues,
  setFormValues,
  handleChangeStep,
}) => {
  const [openRewardsDistribution, setOpenRewardsDistribution] = useState(false);
  const { fund_token: fundToken } = formValues;
  const isMobile = useIsMobile();
  const formId = 'approval-form';
  const isCompetitiveMM =
    formValues.type === CampaignType.COMPETITIVE_MARKET_MAKING;

  const {
    control,
    formState: { errors, touchedFields },
    handleSubmit,
    watch,
    setValue,
  } = useForm<ApprovalFormValues>({
    mode: isMobile ? 'onSubmit' : 'onChange',
    resolver: yupResolver(
      createFundAmountValidationSchema(
        formValues.start_date,
        formValues.end_date,
        formValues.fund_token,
        isCompetitiveMM
      )
    ),
    defaultValues: {
      fund_amount: fundAmount,
      selected_allowance: AllowanceType.CUSTOM,
      custom_allowance_amount: '',
      ...(isCompetitiveMM
        ? { rewards_distribution: formValues.rewards_distribution }
        : {}),
    },
    shouldFocusError: isMobile,
  });

  const {
    fund_amount,
    selected_allowance,
    custom_allowance_amount,
    rewards_distribution,
  } = watch();

  const {
    approve,
    fetchAllowance,
    allowance: currentAllowance,
    isApproving,
    isLoading,
    resetApproval,
  } = useTokenAllowance();

  const { showError } = useNotification();

  useEffect(() => {
    const isAllowanceTouched = !!touchedFields.selected_allowance;
    if (isAllowanceTouched) return;

    fetchAllowance(fundToken).then((allowance) => {
      if (allowance === UNLIMITED_AMOUNT) {
        setValue('selected_allowance', AllowanceType.UNLIMITED);
      }
    });
  }, [touchedFields.selected_allowance, fundToken, fetchAllowance, setValue]);

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

  const handleBackClick = () => {
    handleChangeStep((prev) => prev - 1);
  };

  const handleNextClick = () => {
    handleChangeStep((prev) => prev + 1);
  };

  const saveApprovalStepValues = () => {
    setFundAmount(fund_amount);

    if (isCompetitiveMM && rewards_distribution) {
      setFormValues({
        ...formValues,
        rewards_distribution,
      });
    }
  };

  const onSubmit = async (data: ApprovalFormValues) => {
    const { fund_amount, selected_allowance, custom_allowance_amount } = data;
    let canSkipApproval = false;

    if (!custom_allowance_amount) {
      canSkipApproval =
        (selected_allowance === AllowanceType.UNLIMITED &&
          currentAllowance === UNLIMITED_AMOUNT) ||
        (selected_allowance === AllowanceType.CUSTOM &&
          (currentAllowance === UNLIMITED_AMOUNT ||
            Number(currentAllowance) >= Number(fund_amount)));
    }

    if (canSkipApproval) {
      saveApprovalStepValues();
      handleNextClick();
      return;
    }

    const amountToApprove =
      selected_allowance === AllowanceType.UNLIMITED
        ? UNLIMITED_AMOUNT
        : custom_allowance_amount || fund_amount;

    const isApproved = await approve(fundToken, amountToApprove);

    if (isApproved) {
      saveApprovalStepValues();
      handleNextClick();
      return;
    } else {
      resetApproval();
      showError('Failed to approve tokens, please try again');
      return;
    }
  };

  const inputAdornmentLabel = getTokenInfo(fundToken)?.label || '';

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Stack
        sx={{
          width: '100%',
          mt: 4,
          gridArea: 'main',
        }}
      >
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              gap: { sm: 3, md: 2 },
            }}
          >
            <Stack sx={{ maxWidth: '500px', width: '100%' }}>
              <Stack sx={{ gap: 1.5 }}>
                <Typography
                  variant="h5"
                  sx={{ color: 'neutral.100', fontWeight: 500 }}
                >
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
                                <Typography
                                  variant="body3"
                                  sx={{ color: 'text.primary' }}
                                >
                                  {inputAdornmentLabel}
                                </Typography>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  {errors.fund_amount && (
                    <FormHelperText>
                      {errors.fund_amount.message}
                    </FormHelperText>
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'flex-start', md: 'space-between' },
                      color: 'neutral.100',
                      mt: 0.5,
                      gap: { xs: 0.5, md: 0 },
                    }}
                  >
                    <span>Current allowance:</span>
                    <Typography
                      component="span"
                      variant="body1"
                      sx={{ color: 'accent.main' }}
                    >
                      {currentAllowance === UNLIMITED_AMOUNT
                        ? 'Unlimited'
                        : `${currentAllowance ?? 0} ${fundToken.toUpperCase()}`}
                    </Typography>
                  </Typography>
                </FormControl>
              </Stack>
              {!!rewards_distribution && (
                <Stack sx={{ gap: 1.5, mt: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{ color: 'neutral.100', fontWeight: 500 }}
                  >
                    Rewards Distribution
                  </Typography>
                  {errors.rewards_distribution && (
                    <FormHelperText sx={{ color: 'error.main' }}>
                      {errors.rewards_distribution.message}
                    </FormHelperText>
                  )}
                  <Stack
                    sx={{
                      display:
                        rewards_distribution.length > 0 ? 'flex' : 'none',
                      width: { xs: '100%', md: '380px' },
                      mb: 1.5,
                      gap: 1.5,
                    }}
                  >
                    {rewards_distribution.map((percentage, index) => {
                      const { value, suffix, decimals } = getCompactNumberParts(
                        (percentage * Number(fund_amount)) / 100
                      );
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Typography
                            variant="body3"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                p: 0.25,
                                borderRadius: '50%',
                                bgcolor: 'neutral.200',
                              }}
                            />
                            {`${index + 1}${getOrdinalSuffix(index + 1)} place`}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                bgcolor: 'background.paper',
                                py: 0.5,
                                px: 1.5,
                                borderRadius: '99px',
                                textTransform: 'uppercase',
                              }}
                            >
                              <FormattedNumber
                                value={value}
                                decimals={decimals}
                                suffix={`${suffix} ${fundToken}`}
                              />
                            </Typography>
                            <Typography
                              variant="body3"
                              sx={{
                                color: 'neutral.100',
                                width: '40px',
                                textAlign: 'right',
                              }}
                            >
                              {percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={
                      isLoading ||
                      isApproving ||
                      !fund_amount ||
                      !!errors.fund_amount
                    }
                    sx={{
                      width: { xs: '100%', md: '380px' },
                    }}
                    onClick={() => setOpenRewardsDistribution(true)}
                  >
                    {rewards_distribution.length > 0
                      ? 'Edit reward distribution'
                      : 'Set reward distribution by ranking'}
                  </Button>
                  <RewardsDistribution
                    open={openRewardsDistribution}
                    onClose={() => setOpenRewardsDistribution(false)}
                    data={rewards_distribution}
                    setData={(data) =>
                      setValue('rewards_distribution', data, {
                        shouldValidate: true,
                      })
                    }
                    fundAmount={Number(fund_amount)}
                    fundToken={fundToken}
                  />
                </Stack>
              )}
              <Divider sx={{ my: 4 }} />
              <Stack sx={{ gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" sx={{ color: 'neutral.100' }}>
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
                        <Stack sx={{ gap: { xs: 1, md: 2 } }}>
                          <Stack
                            direction="row"
                            sx={{
                              alignItems: 'center',
                              width: '220px',
                              gap: 1,
                            }}
                          >
                            <FormControlLabel
                              value={AllowanceType.CUSTOM}
                              disabled={isApproving}
                              control={<Radio color="accent" />}
                              label="Limited Allowance"
                              sx={{
                                mr: 0,
                                '& .MuiRadio-root, & .MuiTypography-root': {
                                  fontSize: '16px',
                                  color:
                                    selected_allowance ===
                                      AllowanceType.CUSTOM && !isApproving
                                      ? 'neutral.100'
                                      : 'text.auxiliary',
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
                                    selected_allowance !==
                                      AllowanceType.CUSTOM || isApproving
                                  }
                                  sx={{
                                    width: 220,
                                    display:
                                      selected_allowance ===
                                      AllowanceType.CUSTOM
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
                                            variant="body3"
                                            sx={{ color: 'text.primary' }}
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
                          sx={{
                            alignItems: 'center',
                            width: '220px',
                            gap: 1,
                          }}
                        >
                          <FormControlLabel
                            value={AllowanceType.UNLIMITED}
                            disabled={isApproving}
                            control={<Radio color="accent" />}
                            label="Unlimited Approval"
                            sx={{
                              mr: 0,
                              '& .MuiRadio-root, & .MuiTypography-root': {
                                fontSize: '16px',
                                color:
                                  selected_allowance ===
                                    AllowanceType.UNLIMITED && !isApproving
                                    ? 'neutral.100'
                                    : 'text.auxiliary',
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
          </Stack>
        </form>
      </Stack>
      <BottomNavigation
        formId={formId}
        nextButtonText={isMobile ? 'Confirm' : 'Confirm & Preview'}
        disableNextButton={isLoading || isApproving || hasValidationErrors}
        disableBackButton={isLoading || isApproving}
        handleNextClick={() => {}}
        handleBackClick={handleBackClick}
      />
    </>
  );
};

export default ApprovalStep;
