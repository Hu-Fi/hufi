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
import CryptoPairEntity from '@/components/CryptoPairEntity';
import FormExchangeSelect from '@/components/FormExchangeSelect';
import { FUND_TOKENS } from '@/constants/tokens';
import { useTradingPairs } from '@/hooks/useTradingPairs';
import type { CampaignType, MarketMakingFormValues } from '@/types';
import { getTokenInfo, isExceedingMaximumInteger } from '@/utils';

import { formatInputValue } from '../utils';

import { ExchangeInfoTooltip } from './';

type Props = {
  control: Control<MarketMakingFormValues>;
  errors: FieldErrors<MarketMakingFormValues>;
  watch: UseFormWatch<MarketMakingFormValues>;
  trigger: UseFormTrigger<MarketMakingFormValues>;
  campaignType: CampaignType;
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
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 4, md: 2 }}>
        <Box display="flex" gap={1} width="100%">
          <FormControl
            error={!!errors.exchange}
            sx={{
              width: '100%',
              mb: errors.exchange ? 2 : 0,
              '& .MuiFormHelperText-root': {
                position: 'absolute',
                bottom: 0,
                mb: { xs: -3, md: -2 },
              },
            }}
          >
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
          <ExchangeInfoTooltip />
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
                      label="Trading Pair"
                      error={!!errors.pair}
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
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 4, md: 2 }}>
        <FormControl
          error={!!errors.start_date}
          sx={{
            width: '100%',
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
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 4, md: 2 }}>
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
                placeholder="1"
                type="number"
                error={!!errors.daily_volume_target}
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
