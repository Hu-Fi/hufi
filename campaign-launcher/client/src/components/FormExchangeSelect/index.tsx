import { Autocomplete, Box, TextField } from '@mui/material';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

import { useExchangesContext } from '../../providers/ExchangesProvider';
import { CryptoEntity } from '../CryptoEntity';

type FormExchangeSelectProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  disabled?: boolean;
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
}: FormExchangeSelectProps<TFieldValues, TName>) => {
  const { exchanges, exchangesMap } = useExchangesContext();

  return (
    <Autocomplete
      id="exchange-select"
      slotProps={slotProps}
      options={exchanges?.map((exchange) => exchange.name) || []}
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
            <CryptoEntity
              name={option}
              displayName={exchange?.display_name}
              logo={exchange?.logo}
            />
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
