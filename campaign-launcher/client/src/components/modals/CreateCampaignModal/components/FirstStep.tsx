import { useEffect, useState, type FC } from 'react';

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
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { CampaignType } from '@/types';
import { convertFromSnakeCaseToTitleCase, getTokenInfo } from '@/utils';

import { formatInputValue } from '../utils';

import Steps from './Steps';

enum AllowanceType {
  UNLIMITED = 'unlimited',
  EXACT = 'exact',
  CUSTOM = 'custom',
}

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
      placement={isMobile ? 'left' : 'right'}
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
  fundAmount: yup.string().trim().required('Fund amount is required'),
  allowance: yup.string().oneOf(['unlimited', 'exact', 'custom']),
});

const FirstStep: FC<Props> = ({
  prepareFormValues,
  handleChangeFormStep,
  handleChangeLoading,
  handleCloseModal,
}) => {
  const [inputValues, setInputValues] = useState<
    Record<Exclude<AllowanceType, AllowanceType.UNLIMITED>, string>
  >({
    [AllowanceType.EXACT]: '',
    [AllowanceType.CUSTOM]: '',
  });

  const isMobile = useIsMobile();
  const {
    approve,
    fetchAllowance,
    allowance: currentAllowance,
    isLoading,
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
      campaignType: undefined,
      fundToken: '',
      fundAmount: '',
      allowance: '',
    },
  });

  const { campaignType, fundToken, fundAmount, allowance } = watch();

  useEffect(() => {
    handleChangeLoading(false);
  }, [handleChangeLoading]);

  const handleChangeInputValue = (value: string, field: AllowanceType) => {
    setInputValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePrepareFormValues = () => {
    prepareFormValues({
      fundToken,
      fundAmount,
      campaignType,
    });
  };

  const handleSkip = () => {
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
    } else {
      const amount =
        inputValues[
          allowance as AllowanceType.EXACT | AllowanceType.CUSTOM
        ].toString();
      success = await approve(data.fundToken, amount);
    }

    if (success) {
      setFormValue('allowance', '');
      // handleSkip();
    }
  };

  const handleCancel = () => {
    handleCloseModal();
    resetForm();
  };

  return (
    <Stack gap={2} width="100%" px={{ xs: 0, md: 6 }}>
      <Stack gap={1} justifyContent="center">
        <Typography variant="h4" color="text.primary" textAlign="center" p={1}>
          Launch Campaign
        </Typography>
        <Typography
          variant="alert"
          color="text.secondary"
          mb={1}
          mx="auto"
          display="flex"
          alignItems="center"
          gap={1}
        >
          Staked HMT
          <CheckIcon sx={{ color: 'success.main' }} />
        </Typography>
      </Stack>
      <form onSubmit={handleSubmit(submitForm)}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={4}
        >
          <Typography variant="subtitle2" color="text.primary">
            Campaign Type:
          </Typography>
          <FormControl error={!!errors.campaignType}>
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
                      label="Campaign Type"
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
        <Steps
          steps={['Approve Tokens', 'Create Escrow', 'Completed']}
          stepsCompleted={0}
          isLoading={isLoading}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mt={4}
          gap={4}
          sx={{
            '& .MuiFormHelperText-root': {
              mx: 0,
              whiteSpace: 'pre-line',
            },
          }}
        >
          <FormControl error={!!errors.fundToken} sx={{ flex: 1 }}>
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
                  onChange={(e) => {
                    const { value } = e.target;
                    field.onChange(value);
                    fetchAllowance(value);
                  }}
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
          <FormControl error={!!errors.fundAmount} sx={{ flex: 1 }}>
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
                justifyContent="space-between"
              >
                <span>Current allowance:</span>
                <span>
                  {currentAllowance === 'unlimited'
                    ? 'Unlimited'
                    : `${currentAllowance} ${fundToken.toUpperCase()}`}
                </span>
              </Typography>
            )}
          </FormControl>
        </Stack>
        <Stack
          mt={1}
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
                    width="240px"
                    gap={1}
                  >
                    <FormControlLabel
                      value="unlimited"
                      disabled={!fundToken || isLoading}
                      control={<Radio />}
                      label="Unlimited Approval"
                      sx={{
                        '& .MuiRadio-root, & .MuiTypography-root': {
                          color:
                            allowance === 'unlimited' && !isLoading
                              ? 'text.primary'
                              : 'text.disabled',
                        },
                      }}
                    />
                    <AllowanceTooltip type={AllowanceType.UNLIMITED} />
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={4}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      width="240px"
                      gap={1}
                    >
                      <FormControlLabel
                        value="exact"
                        disabled={!fundToken || isLoading}
                        control={<Radio />}
                        label="Exact Amount Only"
                        sx={{
                          '& .MuiRadio-root, & .MuiTypography-root': {
                            color:
                              allowance === 'exact' && !isLoading
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
                      value={inputValues.exact}
                      placeholder="i.e 100.00 USDT"
                      disabled={allowance !== 'exact' || isLoading}
                      sx={{ width: 220 }}
                      onChange={(e) =>
                        handleChangeInputValue(
                          e.target.value,
                          AllowanceType.EXACT
                        )
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
                          endAdornment: inputValues.exact ? (
                            <InputAdornment
                              position="end"
                              sx={{
                                alignSelf: 'flex-end',
                                margin: 0,
                                mb: 1,
                                ml: 0.5,
                                height: '23px',
                                opacity:
                                  isLoading || allowance !== 'exact' ? 0.5 : 1,
                                pointerEvents: 'none',
                              }}
                            >
                              <Typography variant="body1" color="text.primary">
                                {getTokenInfo(fundToken).label || ''}
                              </Typography>
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    width="max-content"
                    gap={4}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      width="240px"
                      gap={1}
                    >
                      <FormControlLabel
                        value="custom"
                        disabled={!fundToken || isLoading}
                        control={<Radio />}
                        label="Custom Amount"
                        sx={{
                          '& .MuiRadio-root, & .MuiTypography-root': {
                            color:
                              allowance === 'custom' && !isLoading
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
                      value={inputValues.custom}
                      placeholder="i.e 0.00 USDT"
                      disabled={allowance !== 'custom' || isLoading}
                      sx={{ width: 220 }}
                      onChange={(e) =>
                        handleChangeInputValue(
                          e.target.value,
                          AllowanceType.CUSTOM
                        )
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
                          endAdornment: inputValues.custom ? (
                            <InputAdornment
                              position="end"
                              sx={{
                                alignSelf: 'flex-end',
                                margin: 0,
                                mb: 1,
                                ml: 0.5,
                                height: '23px',
                                opacity:
                                  isLoading || allowance !== 'custom' ? 0.5 : 1,
                                pointerEvents: 'none',
                              }}
                            >
                              <Typography variant="body1" color="text.primary">
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
          <Button
            variant="outlined"
            size="medium"
            color="primary"
            disabled={isLoading}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Stack direction="row" gap={2.5}>
            <Button
              variant="contained"
              size="medium"
              color="primary"
              disabled={isLoading || !campaignType}
              onClick={handleSkip}
            >
              Skip
            </Button>
            <Button
              variant="contained"
              size="medium"
              type="submit"
              color="secondary"
              disabled={isLoading || !allowance}
            >
              Approve
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default FirstStep;
