import type { FC, KeyboardEvent, WheelEvent } from 'react';

import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
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
import CryptoPairEntity from '@/components/CryptoPairEntity';
import FormExchangeSelect from '@/components/FormExchangeSelect';
import { MAX_NUMBER_INPUT_LENGTH } from '@/constants';
import { FUND_TOKENS } from '@/constants/tokens';
import { useTradingPairs } from '@/hooks/useTradingPairs';
import type { CampaignType, MarketMakingFormValues } from '@/types';
import { getTokenInfo, isExceedingMaximumInteger } from '@/utils';

import { formatInputValue } from '../utils';

type Props = {
  control: Control<MarketMakingFormValues>;
  errors: FieldErrors<MarketMakingFormValues>;
  watch: UseFormWatch<MarketMakingFormValues>;
  trigger: UseFormTrigger<MarketMakingFormValues>;
  campaignType: CampaignType;
};

const labelStyles = {
  color: 'white',
  mb: 1.5,
  lineHeight: '100%',
  letterSpacing: '0px',
};

const MarketMakingForm: FC<Props> = ({
  control,
  errors,
  watch,
  trigger,
  campaignType,
}) => {
  const exchange = watch('exchange');
  const pair = watch('pair');
  const volumeToken = pair?.split('/')[1] || '';

  const { data: tradingPairs, isLoading: isLoadingTradingPairs } =
    useTradingPairs(exchange);

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: { xs: 4, md: 2 } }}
      >
        <FormControl error={!!errors.exchange} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={labelStyles}>
            Exchange
          </Typography>
          <Controller
            name="exchange"
            control={control}
            render={({ field }) => (
              <FormExchangeSelect<MarketMakingFormValues, 'exchange'>
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
        <FormControl error={!!errors.pair} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={labelStyles}>
            Trading Pair
          </Typography>
          <Controller
            name="pair"
            control={control}
            render={({ field }) => {
              return (
                <Autocomplete
                  id="trading-pair-select"
                  options={tradingPairs || []}
                  loading={isLoadingTradingPairs}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    const [base, quote] = option.split('/');
                    const { label: baseToken } = getTokenInfo(base);
                    const { label: quoteToken } = getTokenInfo(quote);
                    return `${baseToken}/${quoteToken}`;
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
                      placeholder="Select"
                      error={!!errors.pair}
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps.input,
                          endAdornment: (
                            <>
                              {isLoadingTradingPairs ? (
                                <CircularProgress size={20} />
                              ) : null}
                              {params.slotProps.input.endAdornment}
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
                        <CryptoPairEntity symbol={option} size="xs" />
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
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: { xs: 4, md: 2 } }}
      >
        <FormControl
          error={!!errors.start_date}
          sx={{
            width: '100%',
          }}
        >
          <Typography variant="h6" sx={labelStyles}>
            Start Date
          </Typography>
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
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
                    placeholder: 'Select',
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
          }}
        >
          <Typography variant="h6" sx={labelStyles}>
            End Date
          </Typography>
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <MobileDateTimePicker
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
                    placeholder: 'Select',
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
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: { xs: 4, md: 2 } }}
      >
        <FormControl error={!!errors.fund_token} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={labelStyles}>
            Fund Token
          </Typography>
          <Controller
            name="fund_token"
            control={control}
            render={({ field }) => (
              <Select
                aria-label="Fund Token Select"
                id="fund-token-select"
                MenuProps={{
                  slotProps: {
                    paper: {
                      elevation: 4,
                      sx: {
                        bgcolor: 'background.default',
                      },
                    },
                  },
                }}
                {...field}
              >
                {FUND_TOKENS.map((token) => (
                  <MenuItem key={token} value={token}>
                    <CryptoEntity symbol={token} size="xs" />
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
          error={!!errors.daily_volume_target}
          sx={{ width: '100%' }}
        >
          <Typography variant="h6" sx={labelStyles}>
            Daily Volume Target
          </Typography>
          <Controller
            name="daily_volume_target"
            control={control}
            render={({ field }) => (
              <TextField
                id="daily-volume-target-input"
                placeholder="1"
                type="number"
                error={!!errors.daily_volume_target}
                {...field}
                onChange={(e) => {
                  if (e.target.value.length > MAX_NUMBER_INPUT_LENGTH) {
                    return;
                  }
                  const value = formatInputValue(e.target.value);
                  if (isExceedingMaximumInteger(value)) {
                    return;
                  }
                  field.onChange(value);
                }}
                slotProps={{
                  htmlInput: {
                    onWheel: (e: WheelEvent<HTMLInputElement>) => {
                      e.currentTarget.blur();
                    },
                    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                      }
                    },
                    sx: {
                      fieldSizing: 'content',
                      maxWidth: '16ch',
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
                          '.Mui-focused &': {
                            opacity: 1,
                          },
                          'input:not(:placeholder-shown) ~ &': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'text.primary',
                          }}
                        >
                          {getTokenInfo(volumeToken).label || ''}
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
    </>
  );
};

export default MarketMakingForm;
