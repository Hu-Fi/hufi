import { type FC, useEffect } from 'react';

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

import FormExchangeSelect from '@/components/FormExchangeSelect';
import {
  ModalError,
  ModalLoading,
  ModalSuccess,
} from '@/components/ModalState';
import { usePostExchangeApiKey } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  exchangeName?: string;
};

type APIKeyFormValues = {
  apiKey: string;
  secret: string;
  exchange: string;
  memo?: string;
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required').trim().max(50, 'Max 50 characters'),
  secret: yup
    .string()
    .required('Required')
    .trim()
    .max(200, 'Max 200 characters'),
  memo: yup.string().optional().trim().max(32, 'Max 32 characters'),
  exchange: yup.string().required('Required'),
});

const EditApiKeyModal: FC<Props> = ({ open, onClose, exchangeName }) => {
  const {
    mutate: postExchangeApiKey,
    reset: resetMutation,
    error: postExchangeApiKeyError,
    isIdle,
    isPending,
    isSuccess,
    isError,
  } = usePostExchangeApiKey();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm<APIKeyFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      apiKey: '',
      secret: '',
      memo: '',
    },
  });

  const isMobile = useIsMobile();
  const [apiKeyValue, secretValue, exchange, memoValue] = watch([
    'apiKey',
    'secret',
    'exchange',
    'memo',
  ]);

  const isBitmart = exchange === 'bitmart';
  const isSaveDisabled =
    !apiKeyValue?.trim() ||
    !secretValue?.trim() ||
    (isBitmart && !memoValue?.trim());

  useEffect(() => {
    if (open && exchangeName) {
      reset({
        exchange: exchangeName,
        apiKey: '',
        secret: '',
        memo: '',
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
      apiKey: values.apiKey,
      secret: values.secret,
      extras: isBitmart ? { api_key_memo: values.memo || '' } : undefined,
    });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        textAlign: 'center',
        color: 'text.primary',
        px: { xs: 2, md: 4 },
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
          <Typography variant="h4" py={1} mb={{ xs: 3, md: 2 }}>
            Edit API key
          </Typography>
          {isPending && <ModalLoading />}
          {isIdle && (
            <>
              <Box
                display="flex"
                gap={{ xs: 3, md: 1 }}
                mb={3}
                width="100%"
                flexDirection={{ xs: 'column', md: 'row' }}
              >
                <FormControl
                  error={!!errors.exchange}
                  sx={{ width: { xs: '100%', md: '30%' } }}
                >
                  <Controller
                    name="exchange"
                    control={control}
                    render={({ field }) => (
                      <FormExchangeSelect<APIKeyFormValues, 'exchange'>
                        field={field}
                        disabled
                      />
                    )}
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
                        multiline={isMobile}
                        minRows={1}
                        maxRows={4}
                        {...field}
                      />
                    )}
                  />
                  {errors.apiKey && (
                    <FormHelperText>{errors.apiKey.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              <FormControl
                error={!!errors.secret}
                sx={{ mb: 3, width: '100%' }}
              >
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
              {isBitmart && (
                <FormControl
                  error={!!errors.memo}
                  sx={{ mb: 3, width: '100%' }}
                >
                  <Controller
                    name="memo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        type="text"
                        id="memo-input"
                        label="Memo"
                        placeholder="Memo"
                        {...field}
                      />
                    )}
                  />
                  {errors.memo && (
                    <FormHelperText>{errors.memo.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            </>
          )}
          {isSuccess && (
            <ModalSuccess>
              <Typography variant="subtitle2" py={1} mb={1} textAlign="center">
                You have successfully edited your API KEY
              </Typography>
            </ModalSuccess>
          )}
          {isError && (
            <ModalError
              message={
                typeof postExchangeApiKeyError === 'string'
                  ? postExchangeApiKeyError
                  : 'Failed to edit API key.'
              }
            />
          )}
          <Box
            display="flex"
            gap={{ xs: 2, md: 1 }}
            mx="auto"
            width={{ xs: '100%', sm: 'auto' }}
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            {isIdle && (
              <>
                <Button
                  size="large"
                  variant="outlined"
                  fullWidth={isMobile}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={isSaveDisabled}
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
              <Button size="large" variant="contained" onClick={resetMutation}>
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
