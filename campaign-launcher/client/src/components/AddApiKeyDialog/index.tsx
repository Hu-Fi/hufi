import { useEffect, type FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  FormControl,
  FormHelperText,
  Stack,
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
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { usePostExchangeApiKey } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { ExchangeType } from '@/types';
import { scrollToFirstErrorFieldOnMobile } from '@/utils';

export type APIKeyFormValues = {
  apiKey: string;
  secret: string;
  exchange: string;
  memo?: string;
};

export const validationSchema: yup.ObjectSchema<APIKeyFormValues> = yup.object({
  apiKey: yup
    .string()
    .required('Required')
    .trim()
    .max(100, 'Max 100 characters'),
  secret: yup
    .string()
    .required('Required')
    .trim()
    .max(200, 'Max 200 characters'),
  memo: yup
    .string()
    .when('exchange', {
      is: 'bitmart',
      then: (schema) => schema.required('Required'),
      otherwise: (schema) => schema.optional(),
    })
    .trim()
    .max(32, 'Max 32 characters'),
  exchange: yup.string().required('Required'),
});

type Props = {
  open: boolean;
  onClose: () => void;
};

const AddApiKeyDialog: FC<Props> = ({ open, onClose }) => {
  const {
    mutate: postExchangeApiKey,
    reset: resetMutation,
    error: postExchangeApiKeyError,
    isPending,
    isIdle,
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
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      apiKey: '',
      secret: '',
      memo: '',
    },
  });

  const isMobile = useIsMobile();
  const selectedExchange = watch('exchange');
  const isBitmart = selectedExchange === 'bitmart';

  useEffect(() => {
    scrollToFirstErrorFieldOnMobile(isMobile, errors);
  }, [isMobile, errors]);

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
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      isLoading={isPending}
      desktopSx={{ p: 0, height: 670 }}
      mobileSx={{ p: 0, height: '80dvh' }}
    >
      <Stack
        component="form"
        height="100%"
        maxHeight="100%"
        minHeight={0}
        overflow="hidden"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack
          gap={2.5}
          px={{ xs: 2, md: 4 }}
          pt={{ xs: 2, md: 6 }}
          pb={3}
          borderBottom="1px solid #3a2e6f"
        >
          <Typography variant="h5" color="white" fontWeight={700}>
            Add API KEY
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            For you to join a running campaign you must connect your API KEY
          </Typography>
        </Stack>
        <Stack
          pt={{ xs: 2, md: 5 }}
          pb={5}
          px={{ xs: 2, md: 4 }}
          flex={1}
          overflow="auto"
        >
          {isPending && (
            <Stack
              alignItems="center"
              justifyContent="center"
              flex={1}
              gap={2.5}
            >
              <ModalLoading />
              <Typography variant="subtitle2" textAlign="center">
                Connecting API key...
              </Typography>
            </Stack>
          )}
          {isIdle && (
            <Stack
              gap={3}
              width="100%"
              sx={{
                '& .MuiFormHelperText-root': {
                  position: 'absolute',
                  bottom: -16,
                  m: 0,
                  lineHeight: 1,
                },
              }}
            >
              <FormControl
                error={!!errors.exchange}
                sx={{
                  width: { xs: '100%', md: '50%' },
                }}
              >
                <Typography
                  variant="h6"
                  color="white"
                  fontWeight={500}
                  mb={1.5}
                >
                  Exchange
                </Typography>
                <Controller
                  name="exchange"
                  control={control}
                  render={({ field }) => (
                    <FormExchangeSelect<APIKeyFormValues, 'exchange'>
                      field={field}
                      exchangeTypes={[ExchangeType.CEX]}
                      error={!!errors.exchange}
                    />
                  )}
                />
                {errors.exchange && (
                  <FormHelperText>{errors.exchange.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.apiKey} sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  color="white"
                  fontWeight={500}
                  mb={1.5}
                >
                  API Key
                </Typography>
                <Controller
                  name="apiKey"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="text"
                      id="api-key-input"
                      placeholder="Enter"
                      multiline={isMobile}
                      minRows={1}
                      maxRows={4}
                      error={!!errors.apiKey}
                      {...field}
                    />
                  )}
                />
                {errors.apiKey && (
                  <FormHelperText>{errors.apiKey.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.secret} sx={{ width: '100%' }}>
                <Typography
                  variant="h6"
                  color="white"
                  fontWeight={500}
                  mb={1.5}
                >
                  Secret
                </Typography>
                <Controller
                  name="secret"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="password"
                      autoComplete="new-password"
                      id="secret-input"
                      placeholder="Enter"
                      error={!!errors.secret}
                      {...field}
                    />
                  )}
                />
                {errors.secret && (
                  <FormHelperText>{errors.secret.message}</FormHelperText>
                )}
              </FormControl>
              {isBitmart && (
                <FormControl error={!!errors.memo} sx={{ width: '100%' }}>
                  <Typography
                    variant="h6"
                    color="white"
                    fontWeight={500}
                    mb={1.5}
                  >
                    Memo
                  </Typography>
                  <Controller
                    name="memo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        type="text"
                        id="memo-input"
                        placeholder="Enter"
                        error={!!errors.memo}
                        {...field}
                      />
                    )}
                  />
                  {errors.memo && (
                    <FormHelperText>{errors.memo.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            </Stack>
          )}
          {isSuccess && (
            <Stack
              alignItems="center"
              justifyContent="center"
              flex={1}
              gap={2.5}
            >
              <ModalSuccess>
                <Typography
                  variant="subtitle2"
                  py={1}
                  mb={1}
                  textAlign="center"
                >
                  API Key Connected
                </Typography>
              </ModalSuccess>
            </Stack>
          )}
          {isError && (
            <Stack alignItems="center" justifyContent="center" flex={1} gap={3}>
              <ModalError
                message={
                  typeof postExchangeApiKeyError === 'string'
                    ? postExchangeApiKeyError
                    : 'Failed to add API key.'
                }
              />
            </Stack>
          )}
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          py={3}
          px={{ xs: 2, md: 3 }}
          borderTop="1px solid #3a2e6f"
        >
          {isIdle && (
            <Button
              variant="contained"
              size="large"
              type="submit"
              color="error"
              fullWidth={isMobile}
            >
              Connect API key
            </Button>
          )}
          {(isPending || isSuccess) && (
            <Button
              size="large"
              variant="contained"
              color="error"
              disabled={isPending}
              fullWidth={isMobile}
              sx={{ minWidth: 130 }}
              onClick={handleClose}
            >
              Close
            </Button>
          )}
          {isError && (
            <Button
              size="large"
              variant="contained"
              color="error"
              fullWidth={isMobile}
              sx={{ minWidth: 130 }}
              onClick={resetMutation}
            >
              Edit
            </Button>
          )}
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default AddApiKeyDialog;
