import { type ReactNode, useCallback } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { useSnackbar, type SnackbarKey, type VariantType } from 'notistack';

type NotificationOptions = {
  duration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
};

const DEFAULT_DURATION = 5000;

export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showNotification = useCallback(
    (
      message: string | ReactNode,
      variant: VariantType,
      options?: NotificationOptions
    ) => {
      const { duration, position } = options || {};
      const { vertical, horizontal } = position || {
        vertical: 'top',
        horizontal: 'center',
      };
      enqueueSnackbar(message, {
        variant,
        autoHideDuration: duration || DEFAULT_DURATION,
        anchorOrigin: { vertical, horizontal },
        action: (snackbarId: SnackbarKey) => (
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => closeSnackbar(snackbarId)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ),
      });
    },
    [enqueueSnackbar, closeSnackbar]
  );

  const showSuccess = useCallback(
    (message: string | ReactNode, options?: NotificationOptions) => {
      showNotification(message, 'success', options);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string | ReactNode, options?: NotificationOptions) => {
      showNotification(message, 'error', options);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string | ReactNode, options?: NotificationOptions) => {
      showNotification(message, 'warning', options);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string | ReactNode, options?: NotificationOptions) => {
      showNotification(message, 'info', options);
    },
    [showNotification]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
