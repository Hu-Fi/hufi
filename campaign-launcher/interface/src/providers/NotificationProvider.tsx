import { Alert, Snackbar } from '@mui/material';
import { FC, PropsWithChildren, createContext, useState } from 'react';

type Notification = {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
};

export const NotificationContext = createContext<{
  notification?: Notification;
  setNotification: (notification: Notification) => void;
  clearNotification: () => void;
}>({
  setNotification: () => {},
  clearNotification: () => {},
});

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | undefined>();

  const clearNotification = () => {
    setNotification(undefined);
  };

  return (
    <NotificationContext.Provider
      value={{ notification, setNotification, clearNotification }}
    >
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={clearNotification}
        transitionDuration={0}
      >
        <Alert
          onClose={clearNotification}
          severity={notification?.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
