import { FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  TextField,
  Typography,
} from '@mui/material';
import { formatUnits } from 'ethers';
import { Controller, useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import * as yup from 'yup';

import { useWalletBalance } from '../../hooks';

export type StakeHMTFormValues = {
  amount: number;
};

type StakeHMTFormProps = {
  onSubmit: (data: StakeHMTFormValues) => void;
};

export const StakeHMTForm: FC<StakeHMTFormProps> = ({ onSubmit }) => {
  const walletBalance = useWalletBalance();
  const account = useAccount();
  const walletBalanceFormatted = +formatUnits(
    walletBalance.value || '0',
    walletBalance.decimals
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<StakeHMTFormValues>({
    resolver: yupResolver(validationSchema(walletBalanceFormatted)),
    defaultValues: {
      amount: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={6}>
        <Typography variant="h4" color="primary">
          Stake HMT
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
          <FormControl error={!!errors.amount}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  id="amount-input"
                  label="Amount"
                  type="number"
                  error={!!errors.amount}
                  {...field}
                />
              )}
            />
            {errors.amount && (
              <FormHelperText>{errors.amount.message}</FormHelperText>
            )}
          </FormControl>
          <Box display="flex" gap={4}>
            {percentageButtons.map((button) => (
              <Controller
                key={button.label}
                name="amount"
                control={control}
                render={({ field }) => (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      field.onChange(walletBalanceFormatted * button.value);
                    }}
                    sx={{ flexGrow: 1 }}
                  >
                    {button.label}
                  </Button>
                )}
              />
            ))}
          </Box>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ py: 2, borderRadius: 2 }}
            disabled={!account.isConnected}
          >
            Stake
          </Button>
        </Box>
      </Box>
    </form>
  );
};

const validationSchema = (maxAmount: number) =>
  yup.object({
    amount: yup
      .number()
      .required('Required')
      .min(0, 'Amount must be greater than 0')
      .max(maxAmount, 'Insufficient balance'),
  });

const percentageButtons = [
  {
    label: '25%',
    value: 0.25,
  },
  {
    label: '50%',
    value: 0.5,
  },
  {
    label: '75%',
    value: 0.75,
  },
  {
    label: '100%',
    value: 1,
  },
];
