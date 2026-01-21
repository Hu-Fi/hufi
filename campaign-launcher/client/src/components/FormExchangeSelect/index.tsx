import { useMemo } from 'react';

import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

import { ExchangeName } from '@/constants/exchanges';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { CampaignType } from '@/types';

type FormExchangeSelectProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  disabled?: boolean;
  campaignType?: CampaignType;
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
}: FormExchangeSelectProps<TFieldValues, TName>) => {
  const { exchanges, exchangesMap } = useExchangesContext();

  const supportedExchanges = useMemo(() => {
    if (campaignType === CampaignType.MARKET_MAKING) {
      return exchanges;
    }

    return exchanges?.filter(
      (exchange) => exchange.name !== ExchangeName.PANCAKESWAP
    );
  }, [campaignType, exchanges]);

  return (
    <Autocomplete
      id="exchange-select"
      slotProps={slotProps}
      options={supportedExchanges?.map((exchange) => exchange.name) || []}
      getOptionLabel={(option) => {
        const exchange = exchangesMap.get(option);
        return exchange?.display_name || option || '';
      }}
      renderInput={(params) => <TextField {...params} label="Exchange" />}
      renderOption={(props, option) => {
        const exchange = exchangesMap.get(option);
        return (
          <Box
            {...props}
            key={option}
            component="li"
            sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {exchange?.logo && (
                <img
                  src={exchange.logo}
                  alt={exchange.display_name}
                  width={24}
                />
              )}
              <Typography
                color="primary"
                variant="body2"
                sx={{ textTransform: 'capitalize' }}
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
