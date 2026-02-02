import type { FC } from 'react';

import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
  inputBaseClasses,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import dayjs from 'dayjs';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form';

import CryptoEntity from '@/components/CryptoEntity';
import FormExchangeSelect from '@/components/FormExchangeSelect';
import { FUND_TOKENS } from '@/constants/tokens';
import { useExchangeCurrencies } from '@/hooks/useExchangeCurrencies';
import type { CampaignType, HoldingFormValues } from '@/types';
import { getTokenInfo, isExceedingMaximumInteger } from '@/utils';

import { formatInputValue } from '../utils';

import { ExchangeInfoTooltip } from './';

type Props = {
  control: Control<HoldingFormValues>;
  errors: FieldErrors<HoldingFormValues>;
  watch: UseFormWatch<HoldingFormValues>;
  trigger: UseFormTrigger<HoldingFormValues>;
  campaignType: CampaignType;
};

const HoldingForm: FC<Props> = ({
  control,
  errors,
  watch,
  trigger,
  campaignType,
}) => {
  const exchange = watch('exchange');
  const symbol = watch('symbol');

  const isDurationError =
    errors?.start_date?.type === 'duration' ||
    errors?.end_date?.type === 'duration';

  const { data: currencies, isLoading: isLoadingCurrencies } =
    useExchangeCurrencies(exchange);

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 6, md: 2 }}>
        <Box display="flex" gap={1} alignItems="center" width="100%">
          <FormControl error={!!errors.exchange} sx={{ width: '100%' }}>
            <Controller
              name="exchange"
              control={control}
              render={({ field }) => (
                <FormExchangeSelect<HoldingFormValues, 'exchange'>
                  field={field}
                  campaignType={campaignType}
                  error={!!errors.exchange}
                />
              )}
            />
            {errors.exchange && (
              <FormHelperText>{errors.exchange.message}</FormHelperText>
            )}
          </FormControl>
          <ExchangeInfoTooltip />
        </Box>
        <FormControl error={!!errors.symbol} sx={{ width: '100%' }}>
          <Controller
            name="symbol"
            control={control}
            render={({ field }) => {
              return (
                <Autocomplete
                  id="symbol-select"
                  options={currencies || []}
                  loading={isLoadingCurrencies}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    const { label } = getTokenInfo(option);
                    return label || '';
                  }}
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
                      label="Symbol"
                      error={!!errors.symbol}
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingCurrencies ? (
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
                        <CryptoEntity symbol={option} />
                      </Box>
                    );
                  }}
                  {...field}
                  onChange={(_, value) => field.onChange(value)}
                />
              );
            }}
          />
          {errors.symbol && (
            <FormHelperText>{errors.symbol.message}</FormHelperText>
          )}
        </FormControl>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 6, md: 2 }}>
        <FormControl
          error={!!errors.start_date}
          sx={{
            width: '100%',
            '& .MuiFormHelperText-root': {
              mb: isDurationError ? '-40px' : '-20px',
            },
          }}
        >
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
                label="Start Date"
                format="DD-MM-YYYY HH:mm"
                ampm={false}
                disablePast
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  trigger('start_date');
                  trigger('end_date');
                }}
                value={dayjs(field.value)}
                slotProps={{
                  textField: {
                    error: !!errors.start_date,
                  },
                }}
              />
            )}
          />
          {errors.start_date && (
            <FormHelperText>{errors.start_date.message}</FormHelperText>
          )}
        </FormControl>
        <FormControl
          error={!!errors.end_date}
          sx={{
            width: '100%',
            '& .MuiFormHelperText-root': {
              mb: isDurationError ? '-40px' : '-20px',
            },
          }}
        >
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
                label="End Date"
                format="DD-MM-YYYY HH:mm"
                ampm={false}
                disablePast
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  trigger('start_date');
                  trigger('end_date');
                }}
                minDateTime={dayjs(watch('start_date')).add(6, 'hour')}
                value={dayjs(field.value)}
                slotProps={{
                  textField: {
                    error: !!errors.end_date,
                  },
                }}
              />
            )}
          />
          {errors.end_date && (
            <FormHelperText>{errors.end_date.message}</FormHelperText>
          )}
        </FormControl>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 6, md: 2 }}>
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
                MenuProps={{
                  PaperProps: {
                    elevation: 4,
                    sx: {
                      bgcolor: 'background.default',
                    },
                  },
                }}
                {...field}
              >
                {FUND_TOKENS.map((token) => (
                  <MenuItem key={token} value={token}>
                    <CryptoEntity symbol={token} />
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          {errors.fund_token && (
            <FormHelperText>{errors.fund_token.message}</FormHelperText>
          )}
        </FormControl>
        <FormControl
          error={!!errors.daily_balance_target}
          sx={{ width: '100%' }}
        >
          <Controller
            name="daily_balance_target"
            control={control}
            render={({ field }) => (
              <TextField
                id="daily-balance-target-input"
                label="Daily Balance Target"
                placeholder="1"
                type="number"
                error={!!errors.daily_balance_target}
                {...field}
                onChange={(e) => {
                  const value = formatInputValue(e.target.value);
                  if (isExceedingMaximumInteger(value)) {
                    return;
                  }
                  field.onChange(value);
                }}
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
                              opacity: 1,
                            },
                        }}
                      >
                        <Typography variant="body1" color="text.primary">
                          {symbol ? getTokenInfo(symbol).label || '' : ''}
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          {errors.daily_balance_target && (
            <FormHelperText>
              {errors.daily_balance_target.message}
            </FormHelperText>
          )}
        </FormControl>
      </Stack>
    </>
  );
};

export default HoldingForm;
