import {
  type FC,
  type PropsWithChildren,
  type SyntheticEvent,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Alert, type AlertColor, Snackbar } from '@mui/material';

export type NotificationOptions = {
  severity?: AlertColor;
  duration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
};

type Notification = {
  id: string;
  message: string;
  severity: AlertColor;
  duration: number;
  position: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
};

type NotificationProviderContextType = {
  showSuccess: (message: string, options?: NotificationOptions) => void;
  showError: (message: string, options?: NotificationOptions) => void;
  showWarning: (message: string, options?: NotificationOptions) => void;
  showInfo: (message: string, options?: NotificationOptions) => void;
};

const NotificationProviderContext = createContext<
  NotificationProviderContextType | undefined
>(undefined);

const DEFAULT_DURATION = 5000;
const DEFAULT_POSITION = {
  vertical: 'top',
  horizontal: 'center',
} as const;

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    id: '',
    message: '',
    severity: 'info',
    duration: DEFAULT_DURATION,
    position: DEFAULT_POSITION,
  });

  const handleClose = useCallback(
    (_event?: SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen(false);
    },
    []
  );

  const showNotification = useCallback(
    (message: string, options?: NotificationOptions) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        message,
        severity: options?.severity || 'info',
        duration: options?.duration || DEFAULT_DURATION,
        position: options?.position ?? DEFAULT_POSITION,
      };

      setNotification(newNotification);
      setOpen(true);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, options?: NotificationOptions) => {
      showNotification(message, { severity: 'success', ...options });
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, options?: NotificationOptions) => {
      showNotification(message, { severity: 'error', ...options });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, options?: NotificationOptions) => {
      showNotification(message, { severity: 'warning', ...options });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, options?: NotificationOptions) => {
      showNotification(message, { severity: 'info', ...options });
    },
    [showNotification]
  );

  const value = useMemo(
    () => ({
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showSuccess, showError, showWarning, showInfo]
  );

  return (
    <NotificationProviderContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={notification.position}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationProviderContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationProviderContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
