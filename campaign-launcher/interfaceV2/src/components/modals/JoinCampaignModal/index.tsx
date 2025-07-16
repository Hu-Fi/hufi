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
import * as yup from 'yup';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  handleSubmitKeys: (apiKey: string, secret: string) => void;
};

type APIKeyFormValues = {
  apiKey: string;
  secret: string;
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required'),
  secret: yup.string().required('Required'),
});

const JoinCampaignModal: FC<Props> = ({ open, onClose, handleSubmitKeys }) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<APIKeyFormValues>({
    resolver: yupResolver(validationSchema),
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
            Join a Campaign
          </Typography>
          <Typography variant="h5" mb={1}>
            Connect API key
          </Typography>
          <Typography component="p" mb={4}>
            For you to join a running campaign you must connect your API key.{' '}
            <br />
            By connecting your API key, you agree to HUMAN Protocol{' '}
            <strong>Terms of Service</strong> and consent to its{' '}
            <strong>Privacy Policy</strong>.
          </Typography>
          <FormControl error={!!errors.apiKey} sx={{ mb: 4 }}>
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
            Connect API
          </Button>
        </Box>
      </form>
    </BaseModal>
  );
};

export default JoinCampaignModal;
