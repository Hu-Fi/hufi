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
import { Controller, useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import * as yup from 'yup';

export type MintHUSDFormValues = {
  amount: number;
};

type MintHUSDFormProps = {
  isSubmitting?: boolean;
  onSubmit: (data: MintHUSDFormValues) => void;
};

export const MintHUSDForm: FC<MintHUSDFormProps> = ({
  isSubmitting,
  onSubmit,
}) => {
  const account = useAccount();

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<MintHUSDFormValues>({
    resolver: yupResolver(
      yup.object({
        amount: yup
          .number()
          .required('Required')
          .min(0, 'Amount must be greater than 0'),
      })
    ),
    defaultValues: {
      amount: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={6}>
        <Typography variant="h4" color="primary">
          Mint HUSD
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
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ py: 2, borderRadius: 2 }}
            disabled={!account.isConnected || isSubmitting}
          >
            Mint
          </Button>
        </Box>
      </Box>
    </form>
  );
};
