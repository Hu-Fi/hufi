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
            backgroundColor: '#43ba96',
          },
          '.notistack-MuiContent-error': {
            backgroundColor: '#ff6262',
          },
          '.notistack-MuiContent-warning': {
            backgroundColor: '#ffbb00',
          },
          '.notistack-MuiContent-info': {
            backgroundColor: '#6309ff',
          },
        }}
      />
      {children}
    </SnackbarProvider>
  );
};
