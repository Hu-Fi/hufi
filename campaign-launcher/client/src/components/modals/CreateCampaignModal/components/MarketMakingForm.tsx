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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
} from 'react-hook-form';

import CryptoEntity from '@/components/CryptoEntity';
import CryptoPairEntity from '@/components/CryptoPairEntity';
import FormExchangeSelect from '@/components/FormExchangeSelect';
import { FUND_TOKENS } from '@/constants/tokens';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useTradingPairs } from '@/hooks/useTradingPairs';
import type { MarketMakingFormValues } from '@/types';
import { getTokenInfo } from '@/utils';

import ExchangeInfoTooltip from './ExchangeInfoTooltip';

type Props = {
  control: Control<MarketMakingFormValues>;
  errors: FieldErrors<MarketMakingFormValues>;
  watch: UseFormWatch<MarketMakingFormValues>;
  isCreatingEscrow: boolean;
};

const MarketMakingForm: FC<Props> = ({
  control,
  errors,
  watch,
  isCreatingEscrow,
}) => {
  const isMobile = useIsMobile();

  const exchange = watch('exchange');
  const pair = watch('pair');
  const volumeToken = pair?.split('/')[1] || '';

  const { data: tradingPairs, isLoading: isLoadingTradingPairs } =
    useTradingPairs(exchange);

  if (isMobile && isCreatingEscrow) return null;

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <Box display="flex" gap={2} alignItems="center" width="100%">
          <FormControl error={!!errors.exchange} sx={{ width: '100%' }}>
            <Controller
              name="exchange"
              control={control}
              render={({ field }) => (
                <FormExchangeSelect<MarketMakingFormValues, 'exchange'>
                  field={field}
                  disabled={isCreatingEscrow}
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
                disabled={isCreatingEscrow}
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
                disabled={isCreatingEscrow}
              />
            )}
          />
          {errors.fund_amount && (
            <FormHelperText>{errors.fund_amount.message}</FormHelperText>
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
