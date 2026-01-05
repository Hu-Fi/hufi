import { useCallback, useEffect, useState, type FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import CheckIcon from '@mui/icons-material/CheckCircle';
import {
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import CryptoEntity from '@/components/CryptoEntity';
import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { FUND_TOKENS } from '@/constants/tokens';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { AllowanceType, CampaignType } from '@/types';
import { convertFromSnakeCaseToTitleCase, getTokenInfo } from '@/utils';

import { formatInputValue } from '../utils';

import ErrorView from './ErrorView';
import Steps from './Steps';

const allowanceTooltipText = {
  unlimited:
    'Approve unlimited USDT so you don’t need to approve again for future escrows.',
  exact:
    'Approve exactly the missing allowance to fund this escrow. This is the difference between Fund Amount and Current Allowance.',
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

type FormValues = {
  campaignType: CampaignType | null;
  fundToken: string;
  fundAmount: string;
};

type Props = {
  formValues: FormValues;
  prepareFormValues: (newState: FormValues) => void;
  handleChangeFormStep: (formStep: number) => void;
  handleChangeLoading: (isLoading: boolean) => void;
  handleCloseModal: () => void;
};

const validationSchema = yup.object({
  campaignType: yup
    .mixed<CampaignType>()
    .oneOf([...Object.values(CampaignType)])
    .required('Campaign type is required'),
  fundToken: yup.string().trim().required('Fund token is required'),
  fundAmount: yup.string().trim().default(''),
  allowance: yup.string().oneOf(['unlimited', 'exact', 'custom']),
});

const FirstStep: FC<Props> = ({
  formValues,
  prepareFormValues,
  handleChangeFormStep,
  handleChangeLoading,
  handleCloseModal,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');

  const isMobile = useIsMobile();
  const { showError } = useNotification();

  const {
    approve,
    fetchAllowance,
    allowance: currentAllowance,
    isLoading,
    error: approvalError,
    reset: resetApproval,
  } = useTokenAllowance();

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset: resetForm,
    watch,
    setValue: setFormValue,
  } = useForm({
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      campaignType: formValues.campaignType ?? undefined,
      fundToken: formValues.fundToken,
      fundAmount: formValues.fundAmount,
      allowance: '',
    },
  });

  const { campaignType, fundToken, fundAmount, allowance } = watch();

  const showExactInputValue =
    currentAllowance !== 'unlimited' &&
    Number(fundAmount) > Number(currentAllowance);

  useEffect(() => {
    if (fundToken) {
      fetchAllowance(fundToken);
    }
  }, [fundToken, fetchAllowance]);

  useEffect(() => {
    handleChangeLoading(false);
  }, [handleChangeLoading]);

  const handleChangeCustomAmount = (value: string) => {
    setCustomAmount(value);
  };

  const handlePrepareFormValues = () => {
    prepareFormValues({
      fundToken,
      fundAmount,
      campaignType,
    });
  };

  const handleRetry = useCallback(() => {
    resetApproval();
  }, [resetApproval]);

  const handleSkip = () => {
    if (currentAllowance !== 'unlimited' && Number(currentAllowance) < 10) {
      showError(`Allowance should be at least 10 ${fundToken?.toUpperCase()}`);
      return;
    }
    handlePrepareFormValues();
    handleChangeFormStep(2);
  };

  const submitForm = async (data: {
    fundToken: string;
    fundAmount: string;
  }) => {
    if (!allowance) return;

    let success = false;

    if (allowance === AllowanceType.UNLIMITED) {
      success = await approve(data.fundToken, 'max');
    } else if (allowance === AllowanceType.EXACT) {
      success = await approve(data.fundToken, fundAmount);
    } else if (allowance === AllowanceType.CUSTOM) {
      success = await approve(data.fundToken, customAmount);
    }

    if (success) {
      setFormValue('allowance', '');
    }
  };

  const handleCancel = () => {
    handleCloseModal();
    resetForm();
  };

  return (
    <Stack width="100%" px={{ xs: 0, md: 6 }}>
      {approvalError && <ErrorView onRetry={handleRetry} />}
      {!approvalError && (
        <form onSubmit={handleSubmit(submitForm)}>
          <Stack gap={1} justifyContent="center">
            <Typography
              variant="h4"
              color="text.primary"
              textAlign="center"
              p={1}
            >
              Launch Campaign
            </Typography>
            <Typography
              variant="alert"
              color="text.secondary"
              mb={{ xs: 2, md: 1 }}
              mx="auto"
              display="flex"
              alignItems="center"
              gap={1}
            >
              Staked HMT
              <CheckIcon sx={{ color: 'success.main' }} />
            </Typography>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap={1}
            mb={4}
          >
            {!isMobile && (
              <Typography variant="subtitle2" color="text.primary">
                Campaign Type:
              </Typography>
            )}
            <FormControl
              error={!!errors.campaignType}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              <Controller
                name="campaignType"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    disabled={isLoading}
                    value={field.value ?? null}
                    onChange={(_, value) => field.onChange(value)}
                    size="small"
                    options={[...Object.values(CampaignType), null]}
                    getOptionLabel={(option) => {
                      if (option === null) return 'Coming soon...';
                      if (typeof option === 'string') {
                        return convertFromSnakeCaseToTitleCase(option);
                      }
                      return '';
                    }}
                    getOptionDisabled={(option) => option === null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={campaignType ? '' : 'Campaign Type'}
                        sx={{
                          '& .MuiInputBase-root': {
                            height: 42,
                          },
                        }}
                      />
                    )}
                    sx={{ width: { xs: '100%', sm: 220 } }}
                    slotProps={{
                      paper: {
                        elevation: 4,
                        sx: {
                          bgcolor: 'background.default',
                        },
                      },
                    }}
                  />
                )}
              />
              {errors.campaignType && (
                <FormHelperText>{errors.campaignType.message}</FormHelperText>
              )}
            </FormControl>
            <CustomTooltip
              arrow
              placement={isMobile ? 'left' : 'right'}
              title={
                <Link
                  href="https://docs.hu.finance/holding"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary.contrast"
                >
                  What are the campaign types?
                </Link>
              }
            >
              <InfoTooltipInner />
            </CustomTooltip>
          </Stack>
          {!(isMobile || (isMobile && isLoading)) && (
            <Steps stepsCompleted={0} isLoading={isLoading} />
          )}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="flex-start"
            mt={{ xs: 5, md: 4 }}
            gap={{ xs: 3, md: 4 }}
            sx={{
              '& .MuiFormHelperText-root': {
                mx: 0,
                whiteSpace: 'pre-line',
              },
            }}
          >
            <FormControl
              error={!!errors.fundToken}
              sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}
            >
              <InputLabel id="fund-token-select-label">Fund Token</InputLabel>
              <Controller
                name="fundToken"
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
                    disabled={isLoading || !campaignType}
                  >
                    {FUND_TOKENS.map((token) => (
                      <MenuItem key={token} value={token}>
                        <CryptoEntity symbol={token} />
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.fundToken && (
                <FormHelperText>{errors.fundToken.message}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              error={!!errors.fundAmount}
              sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}
            >
              <Controller
                name="fundAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    id="fund-amount-input"
                    label="Fund Amount"
                    placeholder="1"
                    error={!!errors.fundAmount}
                    type="number"
                    sx={{
                      '& .MuiInputBase-root': {
                        height: '59px',
                      },
                    }}
                    {...field}
                    onChange={(e) => {
                      const value = formatInputValue(e.target.value);
                      field.onChange(value);
                    }}
                    disabled={isLoading || !campaignType}
                  />
                )}
              />
              {errors.fundAmount && (
                <FormHelperText>{errors.fundAmount.message}</FormHelperText>
              )}
              {fundToken && (
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
                    {currentAllowance === AllowanceType.UNLIMITED
                      ? 'Unlimited'
                      : `${currentAllowance ?? 0} ${fundToken.toUpperCase()}`}
                  </span>
                </Typography>
              )}
            </FormControl>
          </Stack>
          <Stack
            mt={{ xs: 3, md: 1 }}
            sx={{
              '& .MuiOutlinedInput-root.Mui-disabled': {
                '& fieldset': {
                  borderStyle: 'dashed',
                },
              },
            }}
          >
            <FormControl>
              <Controller
                name="allowance"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    name="allowance"
                    value={field.value}
                    onChange={field.onChange}
                    sx={{ gap: 2 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      width="220px"
                      gap={1}
                    >
                      <FormControlLabel
                        value="unlimited"
                        disabled={!fundToken || isLoading}
                        control={<Radio />}
                        label="Unlimited Approval"
                        sx={{
                          mr: 0,
                          '& .MuiRadio-root, & .MuiTypography-root': {
                            color:
                              allowance === AllowanceType.UNLIMITED &&
                              !isLoading
                                ? 'text.primary'
                                : 'text.disabled',
                          },
                        }}
                      />
                      <AllowanceTooltip type={AllowanceType.UNLIMITED} />
                    </Stack>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      gap={{ xs: 1, md: 2 }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        width="220px"
                        gap={1}
                      >
                        <FormControlLabel
                          value="exact"
                          disabled={
                            !fundToken ||
                            +fundAmount < +(currentAllowance ?? '0') ||
                            isLoading
                          }
                          control={<Radio />}
                          label="Exact Amount Only"
                          sx={{
                            mr: 0,
                            '& .MuiRadio-root, & .MuiTypography-root': {
                              color:
                                allowance === AllowanceType.EXACT && !isLoading
                                  ? 'text.primary'
                                  : 'text.disabled',
                            },
                          }}
                        />
                        <AllowanceTooltip type={AllowanceType.EXACT} />
                      </Stack>
                      <TextField
                        size="small"
                        type="number"
                        value={
                          showExactInputValue
                            ? (
                                Number(fundAmount) - Number(currentAllowance)
                              ).toFixed(2)
                            : ''
                        }
                        placeholder="i.e 100.00 USDT"
                        disabled={
                          allowance !== AllowanceType.EXACT || isLoading
                        }
                        sx={{
                          width: 220,
                          display: {
                            xs:
                              allowance === AllowanceType.EXACT
                                ? 'flex'
                                : 'none',
                            md: 'flex',
                          },
                        }}
                        slotProps={{
                          htmlInput: {
                            readOnly: true,
                            sx: {
                              fieldSizing: 'content',
                              maxWidth: '12ch',
                              minWidth: '1ch',
                              width: 'unset',
                            },
                          },
                          input: {
                            endAdornment: showExactInputValue ? (
                              <InputAdornment
                                position="end"
                                sx={{
                                  alignSelf: 'flex-end',
                                  margin: 0,
                                  mb: 1,
                                  ml: 0.5,
                                  height: '23px',
                                  opacity:
                                    isLoading ||
                                    allowance !== AllowanceType.EXACT
                                      ? 0.5
                                      : 1,
                                  pointerEvents: 'none',
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                >
                                  {getTokenInfo(fundToken).label || ''}
                                </Typography>
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    </Stack>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      gap={{ xs: 1, md: 2 }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        width="220px"
                        gap={1}
                      >
                        <FormControlLabel
                          value="custom"
                          disabled={!fundToken || isLoading}
                          control={<Radio />}
                          label="Custom Amount"
                          sx={{
                            mr: 0,
                            '& .MuiRadio-root, & .MuiTypography-root': {
                              color:
                                allowance === AllowanceType.CUSTOM && !isLoading
                                  ? 'text.primary'
                                  : 'text.disabled',
                            },
                          }}
                        />
                        <AllowanceTooltip type={AllowanceType.CUSTOM} />
                      </Stack>
                      <TextField
                        size="small"
                        type="number"
                        value={customAmount}
                        placeholder="i.e 0.00 USDT"
                        disabled={
                          allowance !== AllowanceType.CUSTOM || isLoading
                        }
                        sx={{
                          width: 220,
                          display: {
                            xs:
                              allowance === AllowanceType.CUSTOM
                                ? 'flex'
                                : 'none',
                            md: 'flex',
                          },
                        }}
                        onChange={(e) =>
                          handleChangeCustomAmount(e.target.value)
                        }
                        slotProps={{
                          htmlInput: {
                            sx: {
                              fieldSizing: 'content',
                              maxWidth: '12ch',
                              minWidth: '1ch',
                              width: 'unset',
                            },
                          },
                          input: {
                            endAdornment: customAmount ? (
                              <InputAdornment
                                position="end"
                                sx={{
                                  alignSelf: 'flex-end',
                                  margin: 0,
                                  mb: 1,
                                  ml: 0.5,
                                  height: '23px',
                                  opacity:
                                    isLoading || allowance !== 'custom'
                                      ? 0.5
                                      : 1,
                                  pointerEvents: 'none',
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                >
                                  {getTokenInfo(fundToken).label || ''}
                                </Typography>
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    </Stack>
                  </RadioGroup>
                )}
              />
            </FormControl>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={4}>
            {!isMobile && (
              <Button
                variant="outlined"
                size="medium"
                color="primary"
                disabled={isLoading}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={3}
              width={{ xs: '100%', md: 'auto' }}
            >
              <Button
                variant="contained"
                size="medium"
                color="primary"
                disabled={isLoading || !campaignType || !fundToken}
                onClick={handleSkip}
                sx={{ order: { xs: 2, md: 1 } }}
              >
                Skip
              </Button>
              <Button
                variant="contained"
                size="medium"
                type="submit"
                color="secondary"
                sx={{ order: { xs: 1, md: 2 } }}
                disabled={
                  isLoading ||
                  !allowance ||
                  (allowance === AllowanceType.CUSTOM && !customAmount)
                }
              >
                Approve
              </Button>
            </Stack>
          </Stack>
        </form>
      )}
    </Stack>
  );
};

export default FirstStep;
