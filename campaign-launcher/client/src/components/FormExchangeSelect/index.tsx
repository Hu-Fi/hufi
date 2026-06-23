import { useMemo } from 'react';

import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

import { ExchangeName } from '@/constants/exchanges';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import type { CampaignType, ExchangeType } from '@/types';
import { isVolumeBasedCampaignType } from '@/utils';

type FormExchangeSelectProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  disabled?: boolean;
  campaignType?: CampaignType;
  exchangeTypes?: ExchangeType[];
  error?: boolean;
};

const slotProps = {
  paper: {
    elevation: 4,
    sx: {
      bgcolor: 'background.default',
    },
  },
};

const FormExchangeSelect = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>({
  field,
  disabled = false,
  campaignType,
  exchangeTypes = [],
  error = false,
}: FormExchangeSelectProps<TFieldValues, TName>) => {
  const { exchanges, exchangesMap } = useExchangesContext();

  const supportedExchanges = useMemo(() => {
    let _exchanges = (exchanges || []).filter((exchange) => exchange.enabled);

    if (exchangeTypes.length) {
      _exchanges = _exchanges.filter((exchange) =>
        exchangeTypes.includes(exchange.type)
      );
    }

    if (campaignType && !isVolumeBasedCampaignType(campaignType)) {
      return _exchanges.filter(
        (exchange) =>
          exchange.name !== ExchangeName.PANCAKESWAP &&
          exchange.name !== ExchangeName.HYPERLIQUID
      );
    }

    return _exchanges;
  }, [campaignType, exchangeTypes, exchanges]);

  return (
    <Autocomplete
      id="exchange-select"
      slotProps={slotProps}
      options={supportedExchanges?.map((exchange) => exchange.name) || []}
      getOptionLabel={(option) => {
        const exchange = exchangesMap.get(option);
        return exchange?.display_name || option || '';
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          aria-label="Exchange Select"
          placeholder="Select"
          error={error}
        />
      )}
      renderOption={(props, option) => {
        const exchange = exchangesMap.get(option);
        return (
          <Box
            {...props}
            key={option}
            component="li"
            sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {exchange?.logo && (
                <img
                  src={exchange.logo}
                  alt={exchange.display_name}
                  width={24}
                />
              )}
              <Typography
                variant="body1"
                sx={{ color: 'neutral.100', textTransform: 'capitalize' }}
              >
                {exchange?.display_name}
              </Typography>
            </Box>
          </Box>
        );
      }}
      disabled={disabled}
      {...field}
      onChange={(_, value) => field.onChange(value)}
    />
  );
};

export default FormExchangeSelect;
