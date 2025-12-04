import { type FC, type PropsWithChildren } from 'react';

import { GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SnackbarProvider maxSnack={5} preventDuplicate>
      <GlobalStyles
        styles={{
          '.notistack-MuiContent': {
            flexWrap: 'nowrap',
          },
          '.notistack-MuiContent-success': {
            backgroundColor: '#0ad397',
          },
          '.notistack-MuiContent-error': {
            backgroundColor: '#fa2a75',
          },
          '.notistack-MuiContent-warning': {
            backgroundColor: '#ffa726',
          },
          '.notistack-MuiContent-info': {
            backgroundColor: '#5d0Ce9',
          },
        }}
      />
      {children}
    </SnackbarProvider>
  );
};
