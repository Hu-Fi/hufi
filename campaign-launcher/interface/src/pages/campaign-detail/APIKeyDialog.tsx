import { FC } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  FormControl,
  FormHelperText,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

export type APIKeyFormValues = {
  apiKey: string;
  secret: string;
};

export type APIKeyDialogProps = DialogProps & {
  onSave: (values: APIKeyFormValues) => void;
  onCancel: () => void;
};

export const APIKeyDialog: FC<APIKeyDialogProps> = ({
  onSave,
  onCancel,
  ...props
}) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<APIKeyFormValues>({
    resolver: yupResolver(validationSchema),
  });

  return (
    <Dialog {...props}>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogTitle>Exchange API Keys</DialogTitle>
        <DialogContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Alert security="error" color="error">
              <Typography variant="body2">
                Provide <b>Read-Only</b> API keys for the exchange.
              </Typography>
            </Alert>
            <Box
              display="flex"
              flexDirection="column"
              width={{
                xs: '100%',
                sm: 500,
              }}
              gap={2}
            >
              <FormControl error={!!errors.apiKey}>
                <Controller
                  name="apiKey"
                  control={control}
                  render={({ field }) => (
                    <TextField id="api-key-input" label="API Key" {...field} />
                  )}
                />
                {errors.apiKey && (
                  <FormHelperText>{errors.apiKey.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl error={!!errors.secret}>
                <Controller
                  name="secret"
                  control={control}
                  render={({ field }) => (
                    <TextField id="secret-input" label="Secret" {...field} />
                  )}
                />
                {errors.secret && (
                  <FormHelperText>{errors.secret.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box p={2} display="flex" gap={2} alignItems="center">
            <Button onClick={onCancel} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained">
              Save
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const validationSchema = yup.object({
  apiKey: yup.string().required('Required'),
  secret: yup.string().required('Required'),
});
