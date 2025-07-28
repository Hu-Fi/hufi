import { FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useExchanges } from '../../../hooks/useExchanges';
import { CryptoEntity } from '../../CryptoEntity';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  handleSubmitKeys: (apiKey: string, secret: string) => void;
};

type APIKeyFormValues = {
  apiKey: string;
  secret: string;
  exchange: string;
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required'),
  secret: yup.string().required('Required'),
  exchange: yup.string().required('Required'),
});

const slotProps = {
  paper: {
    elevation: 4,
    sx: {
      bgcolor: 'background.default',
    },
  },
};

const AddApiKeyModal: FC<Props> = ({ open, onClose, handleSubmitKeys }) => {
  const { data: exchanges } = useExchanges();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<APIKeyFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      exchange: '',
      apiKey: '',
      secret: '',
    },
  });

  const onSubmit = (values: APIKeyFormValues) => {
    handleSubmitKeys(values.apiKey, values.secret);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        textAlign: 'center',
        color: 'text.primary',
        px: { xs: 3, md: 14 },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display="flex" flexDirection="column">
          <Typography variant="h4" py={1} mb={2}>
            Connect API key
          </Typography>
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
                render={({ field }) => {
                  return (
                    <Autocomplete
                      id="exchange-select"
                      slotProps={slotProps}
                      options={exchanges?.map((exchange) => exchange.name) || []}
                      getOptionLabel={(option) => {
                        const exchange = exchanges?.find((e) => e.name === option);
                        return exchange?.displayName || option || '';
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Exchange" />
                      )}
                      renderOption={(props, option) => {
                        const exchange = exchanges?.find(
                          (exchange) => exchange.name === option
                        );
                        return (
                          <Box
                            {...props}
                            key={exchange?.name}
                            component="li"
                            sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                            
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
                      onChange={(_, value) => field.onChange(value)}
                    />
                  );
                }}
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
          <FormControl error={!!errors.secret} sx={{ mb: 4 }}>
            <Controller
              name="secret"
              control={control}
              render={({ field }) => (
                <TextField
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
          <Button
            type="submit"
            variant="contained"
            sx={{ width: '185px', color: 'primary.contrast', mx: 'auto' }}
          >
            Connect Api Key
          </Button>
        </Box>
      </form>
    </BaseModal>
  );
};

export default AddApiKeyModal;
