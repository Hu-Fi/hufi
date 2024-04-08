import { yupResolver } from '@hookform/resolvers/yup';
import {
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
import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useAccount, useChainId } from 'wagmi';
import * as yup from 'yup';

export type CampaignFormValues = {
  chainId: number;
  exchangeName: string;
  requesterAddress: string;
  tokenA: string;
  tokenB: string;
  startDate: Date;
  duration: number;
  fundAmount: number;
};

type CampaignFormProps = {
  onSubmit: (data: CampaignFormValues) => void;
};

export const CampaignForm: FC<CampaignFormProps> = ({ onSubmit }) => {
  const chainId = useChainId();
  const account = useAccount();

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CampaignFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      chainId,
      requesterAddress: account.address,
      exchangeName: 'binance',
      tokenA: 'eth',
      tokenB: 'usdt',
      startDate: new Date(),
      duration: 7862400,
      fundAmount: 0.0001,
    },
  });

  return (
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
          <FormControl error={!!errors.chainId}>
            <InputLabel id="network-select-label">Network</InputLabel>
            <Controller
              name="chainId"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="network-select-label"
                  id="network-select"
                  label="Network"
                  disabled
                  {...field}
                >
                  <MenuItem value={1}>Mainnet</MenuItem>
                  <MenuItem value={11155111}>Sepolia</MenuItem>
                  <MenuItem value={137}>Polygon Mainnet</MenuItem>
                  <MenuItem value={80001}>Polygon Mumbai</MenuItem>
                </Select>
              )}
            />
            {errors.chainId && (
              <FormHelperText>{errors.chainId.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.exchangeName}>
            <InputLabel id="exchange-select-label">Exchange</InputLabel>
            <Controller
              name="exchangeName"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="exchange-select-label"
                  id="exchange-select"
                  label="Exchange"
                  {...field}
                >
                  <MenuItem value={'binance'}>Binance</MenuItem>
                  <MenuItem value={'bitfinex'}>Bitfinex</MenuItem>
                  <MenuItem value={'mexc'}>MEXC</MenuItem>
                </Select>
              )}
            />
            {errors.exchangeName && (
              <FormHelperText>{errors.exchangeName.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.tokenA}>
            <InputLabel id="token-a-select-label">Token A</InputLabel>
            <Controller
              name="tokenA"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="token-a-select-label"
                  id="token-a-select"
                  label="Token A"
                  {...field}
                >
                  <MenuItem value={'eth'}>ETH</MenuItem>
                  <MenuItem value={'bnb'}>BNB</MenuItem>
                  <MenuItem value={'usdt'}>USDT</MenuItem>
                  <MenuItem value={'usdc'}>USDC</MenuItem>
                </Select>
              )}
            />
            {errors.tokenA && (
              <FormHelperText>{errors.tokenA.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl error={!!errors.tokenB}>
            <InputLabel id="token-b-select-label">Token B</InputLabel>
            <Controller
              name="tokenB"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="token-b-select-label"
                  id="token-b-select"
                  label="Token B"
                  {...field}
                >
                  <MenuItem value={'eth'}>ETH</MenuItem>
                  <MenuItem value={'bnb'}>BNB</MenuItem>
                  <MenuItem value={'usdt'}>USDT</MenuItem>
                  <MenuItem value={'usdc'}>USDC</MenuItem>
                </Select>
              )}
            />
            {errors.tokenB && (
              <FormHelperText>{errors.tokenB.message}</FormHelperText>
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
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ py: 2, borderRadius: 2 }}
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
  tokenA: yup.string().required('Required'),
  tokenB: yup
    .string()
    .required('Required')
    .test(
      'not-same-as-token-a',
      'Token B should not be same as Token A',
      function (value) {
        return value !== this.parent.tokenA;
      }
    ),
  startDate: yup.date().required('Required'),
  duration: yup.number().required('Required'),
  fundAmount: yup.number().required('Required'),
});
