import { FC, useEffect } from 'react';

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
import * as yup from 'yup';

import { usePostExchangeApiKey } from '../../../hooks/recording-oracle';
import FormExchangeSelect from '../../FormExchangeSelect';
import { ModalError, ModalLoading, ModalSuccess } from '../../ModalState';
import BaseModal from "../BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
  exchangeName?: string;
};

type APIKeyFormValues = {
  apiKey: string;
  secret: string;
  exchange: string;
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required').trim().max(50, 'Max 50 characters'),
  secret: yup.string().required('Required').trim().max(200, 'Max 200 characters'),
  exchange: yup.string().required('Required'),
});

const EditApiKeyModal: FC<Props> = ({ open, onClose, exchangeName }) => {
  const { mutate: postExchangeApiKey, reset: resetMutation, error, isIdle, isPending, isSuccess, isError } = usePostExchangeApiKey();
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

  useEffect(() => {
    if (open && exchangeName) {
      reset({
        exchange: exchangeName,
        apiKey: '',
        secret: '',
      });
    }
  }, [open, exchangeName, reset]);

  const handleClose = () => {
    if (isPending) return;
    
    reset();
    resetMutation();
    onClose();
  };

  const onSubmit = (values: APIKeyFormValues) => {
    postExchangeApiKey({
      exchangeName: values.exchange,
      apiKey: values.apiKey.trim(),
      secret: values.secret.trim(),
    });
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
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          textAlign="center" 
          px={{ xs: 0, md: 4 }}
        >
          <Typography variant="h4" py={1} mb={2}>
            Edit API key
          </Typography>
          {isPending && <ModalLoading />}
          {isIdle && (
            <>
              <Box display="flex" gap={1} mb={3} width="100%">
                <FormControl error={!!errors.exchange} sx={{ width: '30%' }}>
                  <Controller
                    name="exchange"
                    control={control}
                    render={({ field }) => <FormExchangeSelect<APIKeyFormValues, 'exchange'> field={field} disabled />}
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
                You have successfully edited your API key
              </Typography>
            </ModalSuccess>
          )}
          {isError && <ModalError error={error.message} />}
          <Box display="flex" gap={1} mx="auto">
            {isIdle && (
              <>
                <Button
                  size="large"
                  variant="outlined"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  size="large"
                  type="submit"
                  variant="contained"
                >
                  Save
                </Button>
              </>
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
          </Box>
        </Box>
      </form>
    </BaseModal>
  );
};

export default EditApiKeyModal;