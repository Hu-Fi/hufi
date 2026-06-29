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

import {
  type APIKeyFormValues,
  validationSchema,
} from '@/components/AddApiKeyDialog';
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

type Props = {
  open: boolean;
  exchangeName: string;
  onClose: () => void;
};

const EditApiKeyDialog: FC<Props> = ({ open, exchangeName, onClose }) => {
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
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      apiKey: '',
      secret: '',
      memo: '',
      passphrase: '',
    },
  });

  const isMobile = useIsMobile();
  const [apiKeyValue, secretValue, exchange, memoValue, passphraseValue] =
    watch(['apiKey', 'secret', 'exchange', 'memo', 'passphrase']);

  const isBitmart = exchange === 'bitmart';
  const isKucoin = exchange === 'kucoin';
  const isSaveDisabled =
    !apiKeyValue?.trim() ||
    !secretValue?.trim() ||
    (isBitmart && !memoValue?.trim()) ||
    (isKucoin && !passphraseValue?.trim());

  useEffect(() => {
    if (open && exchangeName) {
      reset({
        exchange: exchangeName,
        apiKey: '',
        secret: '',
        memo: '',
        passphrase: '',
      });
    }
  }, [open, exchangeName, reset]);

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
    let extras: Record<string, string> | undefined;
    switch (values.exchange) {
      case 'bitmart':
        extras = { api_key_memo: values.memo || '' };
        break;
      case 'kucoin':
        extras = { passphrase: values.passphrase || '' };
        break;
    }
    postExchangeApiKey({
      exchangeName: values.exchange,
      apiKey: values.apiKey,
      secret: values.secret,
      extras,
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
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          height: '100%',
          maxHeight: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Stack
          sx={{
            gap: 2.5,
            px: { xs: 2, md: 4 },
            pt: { xs: 2, md: 6 },
            pb: 3,
            borderBottom: '1px solid',
            borderColor: 'border.strong',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: 'neutral.100',
              fontWeight: 700,
            }}
          >
            Edit API KEY
          </Typography>
        </Stack>
        <Stack
          sx={{
            pt: { xs: 2, md: 5 },
            pb: 5,
            px: { xs: 2, md: 4 },
            flex: 1,
            overflow: 'auto',
          }}
        >
          {isPending && (
            <Stack
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 3,
              }}
            >
              <ModalLoading />
              <Typography
                variant="body1"
                sx={{
                  textAlign: 'center',
                }}
              >
                Editing API key...
              </Typography>
            </Stack>
          )}
          {isIdle && (
            <Stack
              sx={{
                gap: 3,
                width: '100%',
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
                sx={{ width: { xs: '100%', md: '50%' } }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: 'neutral.100',
                    fontWeight: 500,
                    mb: 1.5,
                  }}
                >
                  Exchange
                </Typography>
                <Controller
                  name="exchange"
                  control={control}
                  render={({ field }) => (
                    <FormExchangeSelect<APIKeyFormValues, 'exchange'>
                      field={field}
                      disabled
                      exchangeTypes={[ExchangeType.CEX]}
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
                  sx={{
                    color: 'neutral.100',
                    fontWeight: 500,
                    mb: 1.5,
                  }}
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
              <FormControl error={!!errors.secret} sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'neutral.100',
                    fontWeight: 500,
                    mb: 1.5,
                  }}
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
                <FormControl error={!!errors.memo} sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'neutral.100',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
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
              {isKucoin && (
                <FormControl error={!!errors.passphrase} sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    Passphrase
                  </Typography>
                  <Controller
                    name="passphrase"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        type="text"
                        id="passphrase-input"
                        placeholder="Enter"
                        error={!!errors.passphrase}
                        {...field}
                      />
                    )}
                  />
                  {errors.passphrase && (
                    <FormHelperText>{errors.passphrase.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            </Stack>
          )}
          {isSuccess && (
            <Stack
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 3,
              }}
            >
              <ModalSuccess>
                <Typography
                  variant="body1"
                  sx={{
                    py: 1,
                    mb: 1,
                    textAlign: 'center',
                  }}
                >
                  You have successfully edited your API KEY
                </Typography>
              </ModalSuccess>
            </Stack>
          )}
          {isError && (
            <Stack
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 3,
              }}
            >
              <ModalError
                message={
                  typeof postExchangeApiKeyError === 'string'
                    ? postExchangeApiKeyError
                    : 'Failed to edit API key.'
                }
              />
            </Stack>
          )}
        </Stack>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            py: 3,
            px: { xs: 2, md: 3 },
            borderTop: '1px solid',
            borderColor: 'border.strong',
          }}
        >
          {isIdle && (
            <Button
              variant="contained"
              size="large"
              type="submit"
              color="accent"
              fullWidth={isMobile}
              disabled={isSaveDisabled}
            >
              Save
            </Button>
          )}
          {(isPending || isSuccess) && (
            <Button
              size="large"
              variant="contained"
              color="accent"
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
              color="accent"
              fullWidth={isMobile}
              sx={{ minWidth: 130 }}
              onClick={resetMutation}
            >
              Retry
            </Button>
          )}
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default EditApiKeyDialog;
