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
import FormExchangeSelect from '@/components/FormExchangeSelect';
import { FUND_TOKENS } from '@/constants/tokens';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useExchangeCurrencies } from '@/hooks/useExchangeCurrencies';
import type { HoldingFormValues } from '@/types';
import { getTokenInfo } from '@/utils';

import { parseNumber } from '../utils';

import ExchangeInfoTooltip from './ExchangeInfoTooltip';

type Props = {
  control: Control<HoldingFormValues>;
  errors: FieldErrors<HoldingFormValues>;
  watch: UseFormWatch<HoldingFormValues>;
  isCreatingEscrow: boolean;
};

const HoldingForm: FC<Props> = ({
  control,
  errors,
  watch,
  isCreatingEscrow,
}) => {
  const isMobile = useIsMobile();

  const exchange = watch('exchange');
  const symbol = watch('symbol');

  const { data: currencies, isLoading: isLoadingCurrencies } =
    useExchangeCurrencies(exchange);

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
                <FormExchangeSelect<HoldingFormValues, 'exchange'>
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
                      disabled={isCreatingEscrow}
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
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <FormControl error={!!errors.start_date} sx={{ width: '100%' }}>
          <Controller
            name="start_date"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <DatePicker
                label="Start Date"
                format="YYYY-MM-DD"
                closeOnSelect
                disablePast
                {...field}
                value={dayjs(value)}
                onChange={(newValue) => onChange(newValue?.toDate())}
                disabled={isCreatingEscrow}
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
            render={({ field: { onChange, value, ...field } }) => (
              <DatePicker
                label="End Date"
                format="YYYY-MM-DD"
                closeOnSelect
                disablePast
                {...field}
                value={dayjs(value)}
                onChange={(newValue) => onChange(newValue?.toDate())}
                disabled={isCreatingEscrow}
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
          error={!!errors.daily_balance_target}
          sx={{ width: '100%' }}
        >
          <Controller
            name="daily_balance_target"
            control={control}
            render={({ field: { onChange, ...field } }) => (
              <TextField
                id="daily-balance-target-input"
                label="Daily Balance Target"
                type="number"
                error={!!errors.daily_balance_target}
                {...field}
                onChange={(e) => onChange(parseNumber(e.target.value))}
                disabled={isCreatingEscrow}
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
                              opacity: isCreatingEscrow ? 0.5 : 1,
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
