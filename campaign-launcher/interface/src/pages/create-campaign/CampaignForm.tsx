import { FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import * as yup from 'yup';

import { useExchanges, useSymbols } from '../../api/exchange';
import { CryptoEntity, CryptoPairEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { TOKENS } from '../../constants';
import { ExchangeType } from '../../types';

export type CampaignFormValues = {
  chainId: number;
  exchangeName: string;
  requesterAddress: string;
  token: string;
  startDate: Date;
  duration: number;
  fundAmount: number;
  additionalData?: string;
};

type CampaignFormProps = {
  isSubmitting?: boolean;
  onSubmit: (data: CampaignFormValues) => void;
};

export const CampaignForm: FC<CampaignFormProps> = ({
  isSubmitting,
  onSubmit,
}) => {
  const account = useAccount();

  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
  } = useForm<CampaignFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      chainId: account.chainId,
      requesterAddress: account.address,
      exchangeName: '',
      token: '',
      startDate: new Date(),
      duration: 7862400,
      fundAmount: 0.0001,
    },
  });

  const { data: exchanges, isLoading: isLoadingExchanges } = useExchanges();

  const exchangeName = watch('exchangeName');
  const exchange = exchanges?.find(
    (exchange) => exchange.name === exchangeName
  );
  const { data: symbols, isLoading: isLoadingSymbols } =
    useSymbols(exchangeName);

  return isLoadingExchanges || isLoadingSymbols ? (
    <Loading />
  ) : (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={6}>
        <Typography variant="h4" color="primary">
          Create a Campaign
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          width={{
            xs: '100%',
            sm: 500,
          }}
          gap={2}
        >
          <FormControl error={!!errors.exchangeName}>
            <Controller
              name="exchangeName"
              control={control}
              render={({ field }) => {
                return (
                  <Autocomplete
                    id="exchange-select"
                    options={exchanges?.map((exchange) => exchange.name) || []}
                    getOptionLabel={(option) =>
                      exchanges?.find((e) => e.name === option)?.displayName ||
                      ''
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Exchange" />
                    )}
                    renderOption={(props, option) => {
                      // eslint-disable-next-line react/prop-types
                      const { key, ...optionProps } = props;
                      const exchange = exchanges?.find(
                        (exchange) => exchange.name === option
                      );

                      return (
                        <Box
                          key={key}
                          component="li"
                          sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                          {...optionProps}
                        >
                          <CryptoEntity
                            name={option}
                            displayName={exchange?.displayName}
                            logo={exchange?.logo}
                          />
                        </Box>
                      );
                    }}
                    {...field}
                    onChange={(_, value) => {
                      field.onChange(value);
                    }}
                  />
                );
              }}
            />
            {errors.exchangeName && (
              <FormHelperText>{errors.exchangeName.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.token}>
            {exchange?.type === ExchangeType.CEX ? (
              <>
                <Controller
                  name="token"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Autocomplete
                        id="trading-pair-select"
                        options={symbols || []}
                        renderInput={(params) => (
                          <TextField {...params} label="Trading Pair" />
                        )}
                        renderOption={(props, option) => {
                          // eslint-disable-next-line react/prop-types
                          const { key, ...optionProps } = props;

                          return (
                            <Box
                              key={key}
                              component="li"
                              sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                              {...optionProps}
                            >
                              <CryptoPairEntity symbol={option} />
                            </Box>
                          );
                        }}
                        {...field}
                        onChange={(_, value) => {
                          field.onChange(value);
                        }}
                      />
                    );
                  }}
                />
              </>
            ) : (
              <>
                <InputLabel id="token-a-select-label">Token</InputLabel>
                <Controller
                  name="token"
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId="token-a-select-label"
                      id="token-a-select"
                      label="Token A"
                      {...field}
                    >
                      {TOKENS.map((token) => (
                        <MenuItem key={token.name} value={token.name}>
                          <CryptoEntity name={token.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </>
            )}

            {errors.token && (
              <FormHelperText>{errors.token.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.startDate}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Start Date"
                  closeOnSelect
                  disablePast
                  {...field}
                  value={dayjs(field.value)}
                />
              )}
            />
            {errors.startDate && (
              <FormHelperText>{errors.startDate.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.duration}>
            <InputLabel id="duration-select-label">Duration</InputLabel>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="duration-select-label"
                  id="duration-select"
                  label="Duration"
                  {...field}
                >
                  <MenuItem value={7862400}>3 Months</MenuItem>
                  <MenuItem value={15724800}>6 Months</MenuItem>
                  <MenuItem value={31536000}>1 Year</MenuItem>
                </Select>
              )}
            />
            {errors.duration && (
              <FormHelperText>{errors.duration.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.fundAmount}>
            <Controller
              name="fundAmount"
              control={control}
              render={({ field }) => (
                <TextField
                  id="fund-amount-input"
                  label="Fund Amount"
                  error={!!errors.fundAmount}
                  type="number"
                  {...field}
                />
              )}
            />
            {errors.fundAmount && (
              <FormHelperText>{errors.fundAmount.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.additionalData}>
            <Controller
              name="additionalData"
              control={control}
              render={({ field }) => (
                <TextField
                  id="extra-manifest-input"
                  label="Additional Data"
                  error={!!errors.additionalData}
                  type="text"
                  multiline
                  minRows={3}
                  {...field}
                />
              )}
            />
            {errors.additionalData && (
              <FormHelperText>{errors.additionalData.message}</FormHelperText>
            )}
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ py: 2, borderRadius: 2 }}
            disabled={!account.isConnected || isSubmitting}
          >
            Create
          </Button>
        </Box>
      </Box>
    </form>
  );
};

const validationSchema = yup.object({
  chainId: yup.number().required('Required'),
  exchangeName: yup.string().required('Required'),
  requesterAddress: yup.string().required('Required'),
  token: yup.string().required('Required'),
  startDate: yup.date().required('Required'),
  duration: yup.number().required('Required'),
  fundAmount: yup.number().required('Required'),
  additionalData: yup.string().test('is-json', 'Invalid JSON', (value) => {
    if (!value) {
      return true;
    }

    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }),
});
