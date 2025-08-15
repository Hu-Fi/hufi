import { FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { usePostExchangeApiKey } from '../../../hooks/recording-oracle/exchangeApiKeys';
import FormExchangeSelect from '../../FormExchangeSelect';
import { ModalError, ModalLoading, ModalSuccess } from '../../ModalState';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

type APIKeyFormValues = {
  apiKey: string;
  secret: string;
  exchange: string;
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required').trim().max(100, 'Max 100 characters'),
  secret: yup.string().required('Required').trim().max(200, 'Max 200 characters'),
  exchange: yup.string().required('Required'),
});

const AddApiKeyModal: FC<Props> = ({ open, onClose }) => {
  const { mutate: postExchangeApiKey, reset: resetMutation, error, isPending, isIdle, isSuccess, isError } = usePostExchangeApiKey();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<APIKeyFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      apiKey: '',
      secret: '',
    },
  });

  const onSubmit = (values: APIKeyFormValues) => {
    postExchangeApiKey({
      exchangeName: values.exchange,
      apiKey: values.apiKey,
      secret: values.secret,
    });
  };

  const handleClose = () => {
    if (isPending) return;

    reset();
    resetMutation();
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        textAlign: 'center',
        color: 'text.primary',
        px: { xs: 3, md: 4 },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack alignItems="center" textAlign="center" px={{ xs: 0, md: 4 }}>
          <Typography variant="h4" py={1} mb={2}>
            Connect API key
          </Typography>
          {isPending && <ModalLoading />}
          {isIdle && (
            <>
              <Typography component="p" mb={2} textAlign="center">
                For you to join a running campaign you must connect your API key.{' '}
                <br />
                By connecting your API key, you agree to HUMAN Protocol{' '}
                <strong>Terms of Service</strong> and consent to its{' '}
                <strong>Privacy Policy</strong>.
              </Typography>
              <Box display="flex" gap={1} mb={3} width="100%">
                <FormControl error={!!errors.exchange} sx={{ width: '30%' }}>
                  <Controller
                    name="exchange"
                    control={control}
                    render={({ field }) => <FormExchangeSelect<APIKeyFormValues, 'exchange'> field={field} />}
                  />
                  {errors.exchange && (
                    <FormHelperText>{errors.exchange.message}</FormHelperText>
                  )}
                </FormControl>
                <FormControl error={!!errors.apiKey} sx={{ flex: 1 }}>
                  <Controller
                    name="apiKey"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        type="text"
                        id="api-key-input"
                        label="API Key"
                        placeholder="API KEY"
                        {...field}
                      />
                    )}
                  />
                  {errors.apiKey && (
                    <FormHelperText>{errors.apiKey.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              <FormControl error={!!errors.secret} sx={{ mb: 4, width: '100%' }}>
                <Controller
                  name="secret"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="password"
                      autoComplete="new-password" // disables autofill from browser
                      id="secret-input"
                      label="Secret"
                      placeholder="API SECRET KEY"
                      {...field}
                    />
                  )}
                />
                {errors.secret && (
                  <FormHelperText>{errors.secret.message}</FormHelperText>
                )}
              </FormControl>
              
            </>
          )}
          {isSuccess && (
            <ModalSuccess>
              <Typography variant="subtitle2" py={1} mb={1} textAlign="center">
                You have successfully added your API key
              </Typography>
            </ModalSuccess>
          )}
          {isError && <ModalError error={error?.message} />}
          {isIdle && (
            <Button
              size="large"
              type="submit"
              variant="contained"
              sx={{ mx: 'auto' }}
            >
              Connect API key
            </Button>
          )}
          {(isPending || isSuccess) && (
            <Button
              size="large"
              variant="contained"
              disabled={isPending}
              onClick={handleClose}
            >
              Close
            </Button>
          )}
          {isError && (
            <Button
              size="large"
              variant="contained"
              onClick={resetMutation}
            >
              Edit
            </Button>
          )}
        </Stack>
      </form>
    </BaseModal>
  );
};

export default AddApiKeyModal;
